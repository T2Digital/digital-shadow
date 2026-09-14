// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/**
 * @title Polygon Arbitrage Flash Loan Contract (Multi-Strategy V2 - SECURE)
 * @author Shadow Agentic System
 * @notice POKA-YOKE ARCHITECTURE: The Agent wallet can only trigger trades.
 * All profits are strictly locked and can only be withdrawn to the Cold (Master) Wallet.
 */
contract FlashArbitrage is FlashLoanSimpleReceiverBase {
    // SECURITY: Separation of limits
    address public agentWallet;     // Can trigger flash loan (The app's hot wallet)
    address public immutable coldWallet;  // Receives profits (Your main MetaMask wallet)

    // Reentrancy Guard state
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // Polygon Mainnet Addresses (For Reference)
    // Aave V3 PoolAddressesProvider: 0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb
    // QuickSwap Router V2: 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff
    // SushiSwap Router V2: 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506

    modifier onlyAuthorized() {
        require(msg.sender == agentWallet || msg.sender == coldWallet, "Unauthorized access");
        _;
    }

    modifier onlyColdWallet() {
        require(msg.sender == coldWallet, "Only Cold Wallet can execute");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /**
     * @param _addressProvider Aave V3 Addresses Provider on Polygon
     * @param _coldWallet Your highly secure MetaMask wallet for profits
     */
    constructor(
        address _addressProvider, 
        address _coldWallet
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        agentWallet = msg.sender; // The deployer is initially the agent
        coldWallet = _coldWallet; // Hardcoded profit destination
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Allows changing the hot wallet (agent) in case it is compromised
     * @dev Only the secure cold wallet can change the agent wallet
     */
    function updateAgentWallet(address _newAgent) external onlyColdWallet {
        require(_newAgent != address(0), "Invalid agent address");
        agentWallet = _newAgent;
    }

    struct ArbStrategy {
        address router1;
        address router2;
        address targetToken;
        uint256 minAmountOut1;
        uint256 minAmountOut2;
        uint256 deadline;
    }

    /**
     * @notice Step 1: Initiate the Flash Loan with Dynamic Strategy
     * @param asset The address of the token to borrow (e.g. WMATIC, USDC)
     * @param amount The amount to borrow
     * @param router1 First DEX to swap on (e.g. QuickSwap)
     * @param router2 Second DEX to swap on (e.g. SushiSwap)
     * @param targetToken The intermediate token for the arbitrage
     * @param minAmountOut1 Minimum acceptable amount from the first swap (Slippage control)
     * @param minAmountOut2 Minimum acceptable amount from the second swap (Slippage control)
     * @param deadline The unix timestamp before which the transaction must be executed
     */
    function requestFlashLoan(
        address asset, 
        uint256 amount,
        address router1,
        address router2,
        address targetToken,
        uint256 minAmountOut1,
        uint256 minAmountOut2,
        uint256 deadline
    ) public onlyAuthorized nonReentrant {
        require(deadline >= block.timestamp, "Transaction expired");
        
        // Encode the dynamic strategy to be passed to executeOperation
        ArbStrategy memory strategy = ArbStrategy({
            router1: router1,
            router2: router2,
            targetToken: targetToken,
            minAmountOut1: minAmountOut1,
            minAmountOut2: minAmountOut2,
            deadline: deadline
        });
        bytes memory params = abi.encode(strategy);

        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0
        );
    }

    /**
     * @notice Step 2: Receive the loan and execute Arbitrage Logic natively
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Unauthorized caller (Not Pool)");
        require(initiator == address(this), "Untrusted initiator");

        // Decode the strategy payload into memory struct
        ArbStrategy memory strategy = abi.decode(params, (ArbStrategy));
        
        uint256 targetTokenReceived;
        {
            // --- 1. LEG ONE: Swap Borrowed Asset -> Target Token (Router 1) ---
            IERC20(asset).approve(strategy.router1, amount);

            address[] memory path1 = new address[](2);
            path1[0] = asset;
            path1[1] = strategy.targetToken;
            
            uint[] memory amountsOut1 = IUniswapV2Router02(strategy.router1).swapExactTokensForTokens(
                amount,
                strategy.minAmountOut1, // Protects against MEV sandwich attacks
                path1,
                address(this),
                strategy.deadline // Validates transaction is not stale
            );
            targetTokenReceived = amountsOut1[1];
        }
        
        uint256 finalAssetAmount;
        {
            // --- 2. LEG TWO: Swap Target Token -> Borrowed Asset (Router 2) ---
            IERC20(strategy.targetToken).approve(strategy.router2, targetTokenReceived);
            
            address[] memory path2 = new address[](2);
            path2[0] = strategy.targetToken;
            path2[1] = asset;
            
            uint[] memory amountsOut2 = IUniswapV2Router02(strategy.router2).swapExactTokensForTokens(
                targetTokenReceived,
                strategy.minAmountOut2, // Protects against MEV sandwich attacks
                path2,
                address(this),
                strategy.deadline // Validates transaction is not stale
            );
            finalAssetAmount = amountsOut2[1];
        }

        // --- 3. POKA-YOKE: Strict Profitability Check ---
        uint256 amountToRepay = amount + premium;
        
        // Ensure the arbitrage didn't just break even, but made actual profit.
        // If it doesn't cover the loan + premium, revert immediately!
        require(finalAssetAmount > amountToRepay, "Arbitrage not profitable: Execution Reverted (Poka-Yoke)");

        // Allow Aave to pull the repayment
        IERC20(asset).approve(address(POOL), amountToRepay);

        return true;
    }

    /**
     * @notice Withdraw ERC20 profits. 
     * @dev Restricted to Cold Wallet and uses Reentrancy Guard
     */
    function withdrawToken(address _tokenAddress) external onlyColdWallet nonReentrant {
        uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(_tokenAddress).transfer(coldWallet, balance);
    }

    /**
     * @notice Withdraw Native MATIC/POL.
     * @dev Restricted to Cold Wallet and uses Reentrancy Guard
     */
    function withdrawNative() external onlyColdWallet nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No native balance to withdraw");
        (bool success, ) = coldWallet.call{value: balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
