package com.shadow.app;

import android.accessibilityservice.AccessibilityService;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

/**
 * Service to allow the Shadow Agent to have "Continuous Screen Awareness" 
 * and "Real OS App Control" without simulating.
 */
public class ShadowAccessibilityService extends AccessibilityService {

    private static final String TAG = "ShadowVision";
    public static final String ACTION_PERFORM_CLICK = "com.shadow.app.PERFORM_CLICK";
    public static final String EXTRA_TARGET_TEXT = "target_text";

    private final BroadcastReceiver commandReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_PERFORM_CLICK.equals(intent.getAction())) {
                String targetText = intent.getStringExtra(EXTRA_TARGET_TEXT);
                if (targetText != null) {
                    performClickByText(targetText);
                }
            }
        }
    };

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || 
            event.getEventType() == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null) {
                String screenText = extractTextFromNode(rootNode);
                if (!screenText.trim().isEmpty()) {
                    Log.d(TAG, "Screen Context Captured: " + screenText);
                }
                rootNode.recycle();
            }
        }
    }

    private void performClickByText(String text) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null) {
            boolean found = searchAndClick(rootNode, text.toLowerCase());
            Log.i(TAG, "OS App Control: Tried to click '" + text + "'. Success: " + found);
            rootNode.recycle();
        }
    }

    private boolean searchAndClick(AccessibilityNodeInfo node, String lowercaseTarget) {
        if (node == null) return false;
        
        CharSequence nodeText = node.getText();
        CharSequence contentDesc = node.getContentDescription();
        
        boolean matches = false;
        if (nodeText != null && nodeText.toString().toLowerCase().contains(lowercaseTarget)) {
            matches = true;
        } else if (contentDesc != null && contentDesc.toString().toLowerCase().contains(lowercaseTarget)) {
            matches = true;
        }

        if (matches && node.isClickable()) {
            return node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }

        // If matched but not clickable, click its parent
        if (matches) {
            AccessibilityNodeInfo parent = node.getParent();
            while (parent != null) {
                if (parent.isClickable()) {
                    boolean success = parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    parent.recycle();
                    return success;
                }
                AccessibilityNodeInfo oldParent = parent;
                parent = parent.getParent();
                oldParent.recycle();
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                if (searchAndClick(child, lowercaseTarget)) {
                    child.recycle();
                    return true;
                }
                child.recycle();
            }
        }
        return false;
    }

    private String extractTextFromNode(AccessibilityNodeInfo node) {
        StringBuilder sb = new StringBuilder();
        if (node.getText() != null) {
            sb.append(node.getText()).append(" ");
        }
        if (node.getContentDescription() != null) {
            sb.append(node.getContentDescription()).append(" ");
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                sb.append(extractTextFromNode(child));
                child.recycle();
            }
        }
        return sb.toString();
    }

    @Override
    public void onInterrupt() {
        Log.e(TAG, "Shadow Accessibility Service Interrupted");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "Shadow Screen Awareness Active (Accessibility Bridge)");
        IntentFilter filter = new IntentFilter(ACTION_PERFORM_CLICK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(commandReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(commandReceiver, filter);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(commandReceiver);
        } catch (Exception e) {
            // Ignored
        }
    }
}

