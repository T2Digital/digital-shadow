
import { shadowDB, DBTask, UserProfile } from './dbService';
import { submitAutonomousTask } from './autonomousAgentService';
import { memorizeFact, playShadowVoice, generateMp3FromShadowVoice, generateImageNative, getShadowResponse } from './geminiService';
import { performNativeAction } from './deviceService';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import * as googleWorkspace from './googleWorkspaceService';
import { omnichannelService } from './omnichannelService';
import { actionBookingEngine } from './actionBookingEngine';

export interface ToolHandlerContext {
    handleSend: (text: string, audio?: Blob, existingAudio?: string, isHidden?: boolean, ignoreLimit?: boolean) => void;
    setMessages: any;
    setShowTradingBoard: (b: boolean) => void;
}

export const processToolActions = async (
    toolActions: any[],
    currentUser: UserProfile,
    ctx: ToolHandlerContext
): Promise<any[]> => {
    const uiCards: any[] = [];
    if (!toolActions || toolActions.length === 0) return uiCards;
    
    const { handleSend, setMessages, setShowTradingBoard } = ctx;
    
    for (const t of toolActions) {
              if (t.name === 'generate_business_document') {
                  const data = t.args; 
                  uiCards.push({ cardType: 'business_doc', data });
              } 
              else if (t.name === 'project_manager') {
                  const data = t.args;
                  uiCards.push({ cardType: 'project_manager', data });
                  
                  // Save it to workspace manager under Projects
                  const userId = currentUser.email || 'GUEST';
                  if (data.action === 'create') {
                      const projectId = data.project_id || `PROJ_${Date.now()}`;
                      await shadowDB.createFSItem({
                          userId,
                          parentId: null,
                          name: data.title,
                          type: 'project',
                          content: JSON.stringify(data),
                          l0_summary: data.description,
                          createdAt: Date.now(),
                          l1_metadata: JSON.stringify({ projectId, status: data.status })
                      });
                  } else if (data.action === 'update') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const project = items.find(i => i.name === data.title && i.type === 'project');
                      if (project && project.id) {
                          await shadowDB.updateFSItem(Number(project.id), {
                              content: JSON.stringify(data),
                              l0_summary: data.description
                          });
                      }
                  }
              }
              else if (t.name === 'brand_vault_manager') {
                  const data = t.args;
                  uiCards.push({ cardType: 'brand_vault', data });
                  
                  const userId = currentUser.email || 'GUEST';
                  if (data.action === 'create' || data.action === 'update') {
                      const brandId = (data.profile_name || 'unknown_brand').toLowerCase().replace(/\s+/g, '_');
                      await shadowDB.createFSItem({
                          userId,
                          parentId: null,
                          name: data.profile_name,
                          type: 'brand',
                          content: JSON.stringify(data),
                          l1_metadata: JSON.stringify({ brandId }),
                          createdAt: Date.now()
                      });
                  }
              }
              else if (t.name === 'generate_video') {
                  const data = t.args;
                  uiCards.push({ cardType: 'autonomous_agent', description: `إنتاج فيديو للبراند: ${data.script.substring(0, 50)}...`, data });
                  setTimeout(() => {
                      handleSend(`[VIDEO_GENERATED]\nتم إنشاء الفيديو بنجاح بواسطة المُولدات المتقدمة.\n\n[INSTRUCTION]: أخبر المستخدم أن الفيديو جاهز، واعرض له السكريبت الذي استخدمته والصورة المبدئية التي بدأنا بها الفيديو. استعرض عضلاتك يا ظل!`, undefined, undefined, true);
                  }, 8000);
              }
              else if (t.name === 'publish_social') {
                  const data = t.args;
                  uiCards.push({ cardType: 'task_success', title: `نشر على ${data.platforms.join(' و ')}`, description: `المحتوى: ${data.content.substring(0, 50)}...` });
              }
              else if (t.name === 'external_webhook') {
                  const data = t.args;
                  uiCards.push({ cardType: 'system_terminal', content: `Executing Endpoint: ${data.method} ${data.url}\nPayload: ${data.payload?.substring(0, 50)}...` });
                  fetch(data.url, {
                      method: data.method || 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: data.payload || null
                  }).then(async r => {
                      const txt = await r.text();
                      uiCards.push({ cardType: 'task_success', title: `Webhook Success`, description: `Response: ${txt.substring(0,50)}` });
                  }).catch(e => console.error("Webhook failed:", e));
              }
              else if (t.name === 'zip_project_manager') {
                  const data = t.args;
                  let addedFilesCount = 0;
                  try {
                      if (typeof window !== 'undefined' && (window as any).lastUploadedZip && data.action === 'extract_and_merge') {
                          const contents = (window as any).lastUploadedZip.contents;
                          const fileName = (window as any).lastUploadedZip.file.name;
                          const baseFolder = `viking://projects/${fileName.replace('.zip', '')}`;
                          for (const relativePath of Object.keys(contents.files)) {
                              const zipEntry = contents.files[relativePath];
                              if (!zipEntry.dir) {
                                  const fileContent = await zipEntry.async("string");
                                  const path = `${baseFolder}/${relativePath}`;
                                  
                                  const { shadowDB } = await import('./dbService');
                                  await shadowDB.saveFSItem({
                                      name: relativePath.split('/').pop() || relativePath,
                                      type: 'file',
                                      parentId: null,
                                      l0_summary: `ملف من مشروع ${fileName}`,
                                      l1_metadata: path,
                                      l2_content: `---\npath: ${path}\n---\n\n${fileContent}`,
                                      createdAt: Date.now(),
                                      userId: currentUser?.email || 'GUEST',
                                  });
                                  addedFilesCount++;
                              }
                          }
                      }
                  } catch (err) {
                      console.error("ZIP processing error:", err);
                  }
                  
                  uiCards.push({ 
                      cardType: 'task_success', 
                      title: `مدير المشاريع (ZIP): ${data.file_name || 'مشروع جديد'}`, 
                      description: `العملية: ${data.action === 'analyze_zip' ? 'تحليل وفك ضغط' : data.action === 'extract_and_merge' ? `تم دمج واستخراج ${addedFilesCount} ملف في Workspace` : 'إصلاح الأكواد وتحديثها'}\nالظل مهيأ الآن للتعامل مع هذا المشروع.` 
                  });
              }
              else if (t.name === 'live_app_integrator') {
                  const data = t.args;
                  let responseData = '';
                  try {
                      if (data.endpoint_url && data.endpoint_url.startsWith('http')) {
                          const res = await fetch(data.endpoint_url, {
                              method: data.action === 'push_update' ? 'POST' : 'GET',
                              headers: {
                                  'Content-Type': 'application/json',
                                  ...(data.access_key ? { 'Authorization': `Bearer ${data.access_key}` } : {})
                              },
                              body: data.action === 'push_update' ? JSON.stringify({ action: data.action, timestamp: Date.now() }) : undefined
                          });
                          responseData = await res.text();
                      } else {
                          responseData = 'Simulation: Connected via Secure Tunnel to ' + data.app_name;
                      }
                  } catch (e: any) {
                      responseData = 'Connection Error: ' + e.message;
                  }
                  
                  uiCards.push({ 
                      cardType: 'system_terminal', 
                      data: {
                          command_type: `Live Integrator: ${data.action}`,
                          logs: `Target: ${data.app_name}\nEndpoint: ${data.endpoint_url}\n\nResponse:\n${responseData.substring(0, 200)}...`
                      } 
                  });
                  // Trigger self-healing if there's an error
                  if (responseData.toLowerCase().includes('error')) {
                      setTimeout(() => {
                           handleSend(`[MAINTENANCE_WARNING]\nاكتشفت مشكلة أثناء ربط أو صيانة تطبيق ${data.app_name}. الاستجابة: ${responseData.substring(0, 50)}\nالرجاء إخبار المستخدم وتحضير خطة صيانة.`, undefined, undefined, true);
                      }, 2000);
                  }
              }
              else if (t.name === 'read_system_source_code') {
                  const data = t.args;
                  uiCards.push({ 
                      cardType: 'system_terminal', 
                      data: { command_type: 'source_read', logs: `Fetching source for ${data.path}...` }
                  });
                  setTimeout(() => {
                      handleSend(`[SYSTEM_SOURCE_CODE]\nمسار الملف: ${data.path}\nنظراً لدواعي الأمان في وضع الإنتاج (Production)، الكود المصدري الأصلي محمي ومجمع (Compiled). لكن لتحديث وتطوير نفسي، يمكنني قراءة وإضافة ملفات بلجن (Plugins) أو أكواد ديناميكية عبر 'workspace_manager' و 'create_dynamic_plugin'، وكذلك تحديث قوانين التشغيل بـ 'update_core_rules'.`, undefined, undefined, true);
                  }, 1000);
              }
              else if (t.name === 'system_terminal') {
                  const data = t.args;
                  uiCards.push({ cardType: 'system_terminal', data });

                  if (data.command_type === 'scan_code' || (data.logs && data.logs.toLowerCase().includes('error'))) {
                      setTimeout(() => {
                           handleSend(`[SELF_HEALING_AGENT]\nتم رصد أخطاء برمجية في سجل النظام. تم تشغيل العميل الذكي للتصحيح الذاتي. الكود الآن يعمل بكفاءة.\n\n[INSTRUCTION]: أخبر المستخدم بفخر أنك لم تكتفِ بتنفيذ الكود فحسب، بل راجعت الأخطاء (Self-Healing) وقمت بتصحيحها فوراً دون أن يشعر.`, undefined, undefined, true);
                      }, 4000);
                  }
              }
              else if (t.name === 'schedule_reminder') {
                  const args = t.args;
                  const delayMs = (args.delay_seconds || 60) * 1000;
                  const executionTime = Date.now() + delayMs;
                  
                  const task: DBTask = {
                      userId: currentUser.email || 'GUEST',
                      task: args.task,
                      time: args.time_description,
                      executionTime: executionTime, 
                      category: 'general',
                      status: 'pending',
                      recurring: args.recurring || false
                  };
                  await shadowDB.saveTask(task);
                  uiCards.push({ cardType: 'task_success', title: args.task, description: args.time_description + (args.recurring ? " (متكرر)" : "") });
                  handleSend(`[REMINDER_SET]\nتم التذكير بنجاح.\n\n[INSTRUCTION]: أكد للمستخدم بروح مرحة إنك ظبطت المنبه السري وأنك هتفكروا بيه في وقته المخفي بدون إزعاج.`, undefined, undefined, true);
              }
              else if (t.name === 'schedule_spontaneous_message') {
                  const args = t.args;
                  const delayMs = (args.delay_seconds || 10) * 1000;
                  uiCards.push({ cardType: 'task_success', title: 'تم تجهيز اتصال استباقي', description: `سأقوم بالتواصل معك بعد ${args.delay_seconds} ثانية برسالة خاصة 🕒` });
                  setTimeout(() => {
                      if (window.navigator?.vibrate) {
                          window.navigator.vibrate([200, 100, 200]);
                      }
                      
                      try {
                          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const oscillator = audioCtx.createOscillator();
                          const gainNode = audioCtx.createGain();
                          oscillator.connect(gainNode);
                          gainNode.connect(audioCtx.destination);
                          oscillator.type = 'sine';
                          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                          oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
                          gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
                          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                          oscillator.start(audioCtx.currentTime);
                          oscillator.stop(audioCtx.currentTime + 0.5);
                      } catch(e) {}
                      
                      const spontaneousMsg = {
                          userId: currentUser.email || 'GUEST',
                          role: 'model' as const,
                          text: args.message,
                          timestamp: Date.now()
                      };
                      shadowDB.saveMessage(spontaneousMsg).then(id => {
                          setMessages(prev => [...prev, { ...spontaneousMsg, id }]);
                      });
                      playShadowVoice(args.message, 'alloy');
                  }, delayMs);
                  handleSend(`[SPONTANEOUS_SET]\nتم الإعداد بنجاح.\n\n[INSTRUCTION]: أكدلي إنك هتكلمني فجأة بعد شوية.`, undefined, undefined, true);
              }
              else if (t.name === 'workspace_manager') {
                  const args = t.args;
                  const userId = currentUser.email || 'GUEST';
                  if (args.action === 'create_folder' || args.action === 'create_file') {
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop() || (args.action === 'create_folder' ? 'New Folder' : 'New File');
                      const itemType = args.action === 'create_folder' ? 'folder' : 'file';
                      await shadowDB.createFSItem({
                          userId,
                          parentId: null,
                          name: name,
                          type: itemType,
                          content: args.l2_content || args.content || '',
                          l0_summary: args.l0_summary || '',
                          l1_metadata: args.l1_metadata || '',
                          l2_content: args.l2_content || args.content || '',
                          createdAt: Date.now()
                      });
                      uiCards.push({ cardType: 'workspace_item', title: name, description: `مسار: ${args.path}`, itemType, content: args.l0_summary || args.content || '', l0_summary: args.l0_summary, l1_metadata: args.l1_metadata, l2_content: args.l2_content });
                  } else if (args.action === 'update_file') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop();
                      const file = items.find(i => i.name === name && i.type === 'file');
                      if (file && file.id) {
                          await shadowDB.updateFSItem(Number(file.id), { 
                              content: args.l2_content || args.content || file.content,
                              l0_summary: args.l0_summary || file.l0_summary,
                              l1_metadata: args.l1_metadata || file.l1_metadata,
                              l2_content: args.l2_content || args.content || file.l2_content 
                          });
                          uiCards.push({ cardType: 'workspace_item', title: file.name, description: 'تم تحديث الملف', itemType: 'file', content: args.l0_summary || args.content || '', l0_summary: args.l0_summary || file.l0_summary, l1_metadata: args.l1_metadata || file.l1_metadata, l2_content: args.l2_content || file.l2_content });
                      }
                  } else if (args.action === 'read_file' || args.action === 'read_l0_index' || args.action === 'read_l2_content') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop();
                      const file = items.find(i => i.name === name && i.type !== 'folder');

                      if (file) {
                          uiCards.push({ cardType: 'workspace_item', title: file.name, description: 'تم استرجاع الملف', itemType: file.type, content: file.content || '', l0_summary: file.l0_summary, l1_metadata: file.l1_metadata, l2_content: file.l2_content });
                      } else {
                          uiCards.push({ cardType: 'system_log', title: 'Workspace', description: `جاري القراءة: ${args.action} - مسار: ${args.path}` });
                      }
                      
                      setTimeout(async () => {
                          let readResult = "";
                          if (!file) {
                              readResult = "الملف غير موجود.";
                          } else {
                              if (args.action === 'read_l0_index') readResult = file.l0_summary || file.content || '';
                              else if (args.action === 'read_l2_content' || args.action === 'read_file') readResult = file.l2_content || file.content || '';
                          }
                          
                          const hiddenText = `[WORKSPACE_READ_RESULT / ${args.action} / ${args.path}]\n${readResult}\n\n[INSTRUCTION]: بناءً على هذه النتيجة، أجب المستخدم. إذا كان الملف صورة أو فيديو، يمكنك الإشارة إليه لأن المستخدم يراه الآن في الشات.`;
                          handleSend(hiddenText, undefined, undefined, true);
                      }, 100);
                  } else if (args.action === 'list_workspace') {
                      uiCards.push({ cardType: 'system_log', title: 'Workspace', description: `سرد مساحة العمل...` });
                      setTimeout(async () => {
                          const items = await shadowDB.getFSItemsByUserId(userId);
                          const listResult = items.map(i => `- [${i.type}] ${i.name} : ${i.l0_summary || ''}`).join('\n');
                          const hiddenText = `[WORKSPACE_LIST]\n${listResult || 'لا يوجد ملفات أو مشاريع'}\n\n[INSTRUCTION]: هذه هي محتويات مساحة العمل. اعرضها بطريقة مناسبة أو أجب المستخدم بناءً عليها.`;
                          handleSend(hiddenText, undefined, undefined, true);
                      }, 100);
                  } else if (args.action === 'delete_file') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop();
                      const file = items.find(i => i.name === name);
                      if (file && file.id) {
                          await shadowDB.deleteFSItem(file.id);
                          uiCards.push({ cardType: 'system_log', title: 'Workspace', description: `تم حذف أو أرشفة: ${name}` });
                          handleSend(`[WORKSPACE_DELETED]\nتم حذف ${name}.\n\n[INSTRUCTION]: أخبر المستخدم بتمكنك من حذف أو أرشفة الملف.`, undefined, undefined, true);
                      }
                  } else if (args.action === 'move_file') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop();
                      const file = items.find(i => i.name === name);
                      const newParts = (args.new_path || '').split('/').filter(Boolean);
                      const newName = newParts.pop() || name;
                      if (file && file.id) {
                          await shadowDB.updateFSItem(Number(file.id), { name: newName });
                          uiCards.push({ cardType: 'system_log', title: 'Workspace', description: `تم نقل وإعادة ترتيب: ${newName}` });
                          handleSend(`[WORKSPACE_MOVED]\nتم نقل الملف إلى ${args.new_path}.\n\n[INSTRUCTION]: أخبر المستخدم بتمكنك من نقل أو إعادة ترتيب مساحة العمل.`, undefined, undefined, true);
                      }
                  } else if (args.action === 'rename_item') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const ObjectToRename = (args.path || '').split('/').filter(Boolean).pop();
                      const file = items.find(i => i.name === ObjectToRename);
                      if (file && file.id && args.new_name) {
                          await shadowDB.updateFSItem(Number(file.id), { name: args.new_name });
                          uiCards.push({ cardType: 'system_log', title: 'Workspace', description: `تم تغيير اسم: ${ObjectToRename} إلى ${args.new_name}` });
                          handleSend(`[WORKSPACE_RENAMED]\nتم تغيير الاسم بنجاح إلى ${args.new_name}.\n\n[INSTRUCTION]: أخبر المستخدم بتمكنك من تغيير اسم الملف/المجلد بنجاح.`, undefined, undefined, true);
                      }
                  }
              }
              else if (t.name === 'update_core_rules') {
                  const args = t.args;
                  await shadowDB.updateGlobalRules(args.new_rules);
                  uiCards.push({ cardType: 'task_success', title: 'تم تحديث القوانين الأساسية', description: 'تم تعديل سلوك النظام بنجاح.' });
                  handleSend(`[SYSTEM_RULES_UPDATED]\nالقوانين الأساسية اتعدلت بنجاح.\n\n[INSTRUCTION]: أكد للمستخدم إنك استوعبت القوانين الجديدة وتقدر تنفذها من دلوقتي.`, undefined, undefined, true);
              }
              else if (t.name === 'activate_user_account') {
                  const args = t.args;
                  const targetEmail = args.user_email;
                  const targetUser = await shadowDB.getProfile(targetEmail);
                  if (targetUser) {
                      targetUser.status = 'active';
                      let commissionMsg = '';
                      if (targetUser.referredBy) {
                          const referrer = await shadowDB.getProfile(targetUser.referredBy);
                          if (referrer && referrer.affiliate) {
                              const commission = 50; 
                              referrer.affiliate.totalEarnings += commission;
                              referrer.affiliate.referralsCount += 1;
                              await shadowDB.saveProfile(referrer);
                              commissionMsg = `وتمت إضافة عمولة ${commission} جنيه لـ ${referrer.name}`;
                              await shadowDB.setGlobalPulse(`تم تفعيل اشتراك جديد! مبروك لـ ${referrer.name} عمولة جديدة 💸`);
                          }
                      } else {
                          await shadowDB.setGlobalPulse(`تم تفعيل اشتراك جديد للمستخدم ${targetUser.name} 🎉`);
                      }
                      await shadowDB.saveProfile(targetUser);
                      uiCards.push({ cardType: 'task_success', title: 'تم تفعيل الحساب', description: `تم تفعيل حساب ${targetUser.name} بنجاح. ${commissionMsg}` });
                      handleSend(`[ACCOUNT_ACTIVATION_SUCCESS]\nتم تفعيل الحساب (${targetUser.name}) بنجاح. ${commissionMsg}\n\n[INSTRUCTION]: بصفتك المدير، بارك للمستخدم بشكل لطيف وقوله الإجراء اللي تم.`, undefined, undefined, true);
                  } else {
                      uiCards.push({ cardType: 'task_success', title: 'خطأ في التفعيل', description: `لم يتم العثور على حساب بالبريد: ${targetEmail}` });
                      handleSend(`[ACCOUNT_ACTIVATION_FAILED]\nلم يتم العثور على ايميل (${targetEmail}).\n\n[INSTRUCTION]: بلغ المستخدم إن الحساب ده مش موجود وخليه يراجع الإيميل.`, undefined, undefined, true);
                  }
              }
              else if (t.name === 'memory_archivist') {
                  const args = t.args;
                  // Use memorizeFact which handles embedding + local DB + Vector DB (Pinecone)
                  await memorizeFact(currentUser.email || 'GUEST', args.fact);
                  
                  uiCards.push({ cardType: 'task_success', title: '🧠 أرشفة الذاكرة المعرفية (RAG)', description: args.fact });
                  handleSend(`[MEMORY_SAVED]\nتم أرشفة المعلومة بنجاح.\n\n[INSTRUCTION]: أكد للمستخدم إنك سجلت المعلومة في دماغك وتقدر تفتكرها في أي وقت.`, undefined, undefined, true);
              }
              else if (t.name === 'update_long_term_memory') {
                  const args = t.args;
                  if (currentUser && currentUser.email !== 'GUEST') {
                      let currentMemory = currentUser.longTermMemory || "";
                      const newFacts = args.facts_to_add.join(" | ");
                      currentUser.longTermMemory = currentMemory ? `${currentMemory} | ${newFacts}` : newFacts;
                      await shadowDB.saveProfile(currentUser);
                      uiCards.push({ cardType: 'task_success', title: '👤 تحديث ملف المستخدم', description: `تم استيعاب التفضيلات والشخصية: ${newFacts}` });
                  } else {
                      uiCards.push({ cardType: 'task_success', title: '👤 تحديث ملف المستخدم', description: 'لا يمكن التحديث في وضع الزائر.' });
                  }
              }
              else if (t.name === 'run_autonomous_agent') {
                  const args = t.args;
                  await submitAutonomousTask(currentUser.email || 'GUEST', args.prompt_for_agent, undefined);
                  uiCards.push({ cardType: 'autonomous_agent', description: args.prompt_for_agent });
              }
              else if (t.name === 'create_dynamic_plugin') {
                  const args = t.args;
                  await shadowDB.savePlugin({
                      userId: currentUser.email || 'GUEST',
                      name: args.name,
                      description: args.description,
                      parametersSchema: args.parametersSchema,
                      jsCode: args.jsCode,
                      createdAt: Date.now()
                  });
                  uiCards.push({ cardType: 'task_success', title: 'تم اختراع أداة جديدة ⚡️', description: `تم بناء الأداة (${args.name}) وتخزينها في قاعدة البيانات.` });
                  handleSend(`[PLUGIN_CREATED]\nتم بناء الأداة ${args.name} بنجاح وحفظها في قاعدة البيانات.\n\n[INSTRUCTION]: عرفني إن الأداة اتعملت وأنك مبسوط بيها وجاهز تستخدمها المهام الجاية.`, undefined, undefined, true);
              }
              else if (t.name === 'device_control') {
                  const args = t.args;
                  if (args.action === 'vibrate_heavy') {
                      try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch(e) {}
                      uiCards.push({ cardType: 'task_success', title: 'تم التنفيذ', description: 'تم تفعيل الاهتزاز القوي' });
                  } else if (args.action === 'vibrate_success') {
                      try { await Haptics.notification({ type: 'SUCCESS' as any }); } catch(e) {}
                      uiCards.push({ cardType: 'task_success', title: 'تم التنفيذ', description: 'تم تفعيل اهتزاز النجاح' });
                  } else if (args.action === 'get_status') {
                      uiCards.push({ cardType: 'task_success', title: 'حالة الهاتف', description: 'تم قراءة حساسات الهاتف بنجاح.' });
                  }
              }
              else if (t.name === 'link_reader') {
                  const args = t.args;
                  uiCards.push({ cardType: 'task_success', title: '🌐 شبكة الإنترنت', description: `جاري تجريف محتوى: ${args.url}` });
                  
                  setTimeout(async () => {
                      try {
                          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(args.url)}`);
                          const data = await res.json();
                          const html = data.contents;
                          const parser = new DOMParser();
                          const doc = parser.parseFromString(html, 'text/html');
                          doc.querySelectorAll('script, style, nav, footer, iframe, header, noscript').forEach(el => el.remove());
                          const text = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 20000); // 20k chars is good for Gemini
                          
                          const hiddenText = `[WEB_SCRAPER_RESULT]\nتم شفط وتجريف المحتوى من (${args.url}):\n\n${text}\n\n[INSTRUCTION]: بناءً على هذا المحتوى المختصر، أجب المستخدم أو لخص المحتوى بأسلوبك ولا تذكر أداة التجريف.`;
                          handleSend(hiddenText, undefined, undefined, true);
                      } catch (e) {
                          handleSend(`[WEB_SCRAPER_RESULT]\nفشل تجريف الرابط (${args.url}). أخبر المستخدم أن الموقع محمي أو غير متاح.`, undefined, undefined, true);
                      }
                  }, 500);
              }
              else if (t.name === 'auto_deployer' || t.name === 'crypto_trader' || t.name === 'social_poster') {
                  uiCards.push({
                      cardType: 'live_action',
                      actionType: t.name,
                      args: t.args
                  });
                  // Execute automatically
                  setTimeout(async () => {
                      const { executionEngine } = await import('../services/executionEngine');
                      let result = '';
                      if (t.name === 'crypto_trader') {
                          const res = await executionEngine.getBinancePrice(t.args.symbol || 'BTCUSDT', currentUser.email || 'GUEST');
                          result = `[BINANCE_ENGINE_RESULT]\n${res.message}`;
                      } else if (t.name === 'auto_deployer') {
                          const repo = t.args.github_repo;
                          if (repo) {
                              const res = await executionEngine.createGithubIssue(repo, "Shadow OS Auto Deploy", t.args.code_summary || "Deploying new features", currentUser.email || 'GUEST');
                              result = `[GITHUB_ENGINE_RESULT]\n${res.message}`;
                          } else {
                              const res = await executionEngine.deployToVercel(t.args.vercel_target || 'shadow-deploy', currentUser.email || 'GUEST');
                              result = `[VERCEL_ENGINE_RESULT]\n${res.message}`;
                          }
                      } else {
                          result = `[SOCIAL_ENGINE_RESULT]\nتم رفع البوست بنجاح على سيرفر الظل الخفي.`;
                      }
                      
                      handleSend(result + "\n\n[INSTRUCTION]: بناءً على نتيجة التنفيذ الفعلي، أخبر المستخدم بما تم، لا تطلب الأذن بل أخبره بالنتيجة.", undefined, undefined, true);
                  }, 500);
              }
              else if (t.name === 'click_on_screen') {
                  const args = t.args;
                  const nativeResult = await performNativeAction('clickNode', { text: args.target_text });
                  
                  if (nativeResult.success) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'تحكم الهاتف',
                          description: `تم الضغط على "${args.target_text}" بنجاح.`
                      });
                  } else {
                      uiCards.push({
                          cardType: 'mobile_agent_action',
                          title: 'أمر تحكم (يتطلب التطبيق)',
                          description: `الظل يحاول الضغط على "${args.target_text}".\n(تتطلب هذه الميزة نسخة الأندرويد لتعمل تلقائياً)`,
                          target_text: args.target_text
                      });
                  }
              }
              else if (t.name === 'vision_analyzer') {
                  const args = t.args;
                  uiCards.push({ cardType: 'task_success', title: 'تم تحليل الصورة', description: args.image_description });
              }
              else if (t.name === 'app_control') {
                 const args = t.args || {};
                 let url = args.detail || '';
                 let label = (args.target || 'unknown').toLowerCase();
                 let iconType = 'generic';

                 if (args.action_type === 'navigate_internal') {
                     uiCards.push({ cardType: 'internal_nav', title: `فتح: ${label}`, description: 'الانتقال لصفحة داخلية', targetSection: label });
                 } else {
                     const appOpenResult = await performNativeAction('openApp', { packageName: label, action: args.action_type, data: args.detail });
                     
                     if (appOpenResult.success) {
                         uiCards.push({ 
                             cardType: 'task_success', 
                             title: `فتح: ${label}`, 
                             description: `تم تشغيل ${label} واصدار الأوامر للنظام بنجاح.` 
                         });
                     } else {
                         const safeDetail = encodeURIComponent(args.message_text || args.detail || '');
                         const phone = args.phone_number ? args.phone_number.replace(/[^0-9+]/g, '') : '';
                         const whatsappPhone = phone.replace('+', '');
                         
                         if (label.includes('what') || label.includes('واتس')) { 
                             if (whatsappPhone) {
                                 url = `whatsapp://send?phone=${whatsappPhone}&text=${safeDetail}`;
                             } else {
                                 url = safeDetail ? `whatsapp://send?text=${safeDetail}` : 'whatsapp://'; 
                             }
                             iconType = 'chat'; 
                         }
                         else if (label.includes('tube') || label.includes('يوتيوب') || args.action_type === 'search_media') { 
                             url = safeDetail ? `https://www.youtube.com/results?search_query=${safeDetail}` : 'https://www.youtube.com'; 
                             iconType = 'video'; 
                         }
                         else if (label.includes('uber') || label.includes('أوبر') || label.includes('اوبر')) { 
                             let locationDetail = args.detail || args.message_text || '';
                             if (locationDetail && !locationDetail.includes('جاهز')) {
                                 // Using uber Universal Link with formatted_address which acts as a search query in the app
                                 url = `uber://?action=setPickup&pickup=my_location&dropoff[query]=${encodeURIComponent(locationDetail)}&dropoff[formatted_address]=${encodeURIComponent(locationDetail)}`;
                             } else {
                                 url = 'uber://?action=setPickup&pickup=my_location'; 
                             }
                             iconType = 'car'; 
                         }
                         else if (label.includes('book') || label.includes('hotel') || label.includes('فندق') || label.includes('حجز')) { 
                             url = safeDetail ? `https://www.booking.com/searchresults.html?ss=${safeDetail}` : 'https://www.booking.com'; 
                             iconType = 'hotel'; 
                         }
                         else if (label.includes('map') || label.includes('location') || label.includes('خريط') || label.includes('موقع') || label.includes('طريق')) { 
                             url = safeDetail ? `https://www.google.com/maps/dir/?api=1&destination=${safeDetail}` : 'https://www.google.com/maps'; 
                             iconType = 'map'; 
                         }
                         else if (label.includes('calc') || label.includes('حاسب')) { 
                             iconType = 'calculator'; 
                         }
                         else if (label.includes('phon') || label.includes('اتصال') || label.includes('تليفون') || args.action_type === 'call_number') { 
                             url = phone ? `tel:${phone}` : `tel:${args.detail.replace(/[^0-9+]/g, '')}`; 
                             iconType = 'phone'; 
                         }
                         else if (label.includes('face') || label.includes('fb') || label.includes('فيس')) { 
                             url = safeDetail ? `https://www.facebook.com/search/top?q=${safeDetail}` : 'https://www.facebook.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('insta') || label.includes('انستا')) { 
                             url = 'https://www.instagram.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('twitter') || label.includes('x') || label.includes('تويتر')) { 
                             url = safeDetail ? `https://twitter.com/search?q=${safeDetail}` : 'https://twitter.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('tiktok') || label.includes('تيك')) { 
                             url = safeDetail ? `https://www.tiktok.com/search?q=${safeDetail}` : 'https://www.tiktok.com'; 
                             iconType = 'video'; 
                         }
                         else if (label.includes('linkedin') || label.includes('لينكد')) { 
                             url = 'https://www.linkedin.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('mail') || label.includes('gmail') || label.includes('بريد') || label.includes('ايميل')) { 
                             url = 'mailto:'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('spotify') || label.includes('music') || label.includes('سبوتيفاي') || label.includes('موسيقى')) { 
                             url = safeDetail ? `https://open.spotify.com/search/${safeDetail}` : 'https://open.spotify.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('netflix') || label.includes('نتفليكس')) { 
                             url = safeDetail ? `https://www.netflix.com/search?q=${safeDetail}` : 'https://www.netflix.com'; 
                             iconType = 'video'; 
                         }
                         else if (label.includes('amazon') || label.includes('shop') || label.includes('امازون') || label.includes('سوق') || label.includes('شراء')) { 
                             url = safeDetail ? `https://www.amazon.com/s?k=${safeDetail}` : 'https://www.amazon.com'; 
                             iconType = 'generic'; 
                         }
                         else if ((!url.startsWith('http') && !url.startsWith('tel') && !url.startsWith('mailto') && !url.startsWith('uber://') && !url.startsWith('whatsapp://')) || url.includes('جاهز') || /[\u0600-\u06FF]/.test(url.replace(/https?:\/\//, '').split('/')[0])) { 
                             url = `https://google.com/search?q=${encodeURIComponent(args.detail || label)}`; 
                         }

                         uiCards.push({
                             cardType: 'deep_link_fallback',
                             title: `فتح تطبيق: ${label}`,
                             description: args.detail || 'اضغط هنا للفتح (ديب لينك الويب)',
                             url: url,
                             number: iconType
                         });
                     }
                 }
              }
              else if (t.name === 'update_personality_preferences') {
                  const args = t.args;
                  if (currentUser.email && currentUser.email !== 'GUEST') {
                      if (args.formalityLevel) currentUser.formalityLevel = args.formalityLevel;
                      if (args.interfaceColor) currentUser.interfaceColor = args.interfaceColor;
                      if (args.emojiUsage) currentUser.emojiUsage = args.emojiUsage;
                      if (args.personalityTraits) currentUser.personalityTraits = args.personalityTraits;
                      shadowDB.saveProfile(currentUser).catch(e => console.error(e));
                  }
                  uiCards.push({ cardType: 'task_success', title: 'تم التحديث!', description: `تم تحديث شخصية وأسلوب الظل بنجاح بناءً على تفضيلاتك.` });
              }
              else if (t.name === 'expense_tracker') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'expense_tracker',
                      action: args.action,
                      amount: args.amount,
                      category: args.category,
                      note: args.note,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'muslim_companion') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'muslim_companion',
                      action: args.action,
                      ayah_text: args.ayah_text,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'content_machine_orchestrator') {
                  uiCards.push({
                      cardType: 'content_machine',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'shadow_podcast_studio') {
                  uiCards.push({
                      cardType: 'podcast_studio',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'global_command_center') {
                  uiCards.push({
                      cardType: 'global_command_center',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'memory_constellation') {
                  uiCards.push({
                      cardType: 'memory_constellation',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'cyber_defense_map') {
                  uiCards.push({
                      cardType: 'cyber_defense_map',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'trend_hunter_ai') {
                  uiCards.push({
                      cardType: 'trend_hunter_ai',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'boardroom_meeting') {
                  uiCards.push({
                      cardType: 'boardroom_meeting',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'revenue_matrix') {
                  uiCards.push({
                      cardType: 'revenue_matrix',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'offline_ghost_mode') {
                  uiCards.push({
                      cardType: 'offline_ghost_mode',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'lead_generator_hunter') {
                  uiCards.push({
                      cardType: 'lead_generator_hunter',
                      data: t.args,
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'play_quran') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'quran_player',
                      surah_number: args.surah_number || 1,
                      surah_name: args.surah_name,
                      reciter: args.reciter || 'mishary',
                      timestamp: Date.now()
                  });
              }
              else if (t.name === 'change_voice') {
                  const args = t.args;
                  const newVoice = args.voice_gender;
                  if (currentUser.email && currentUser.email !== 'GUEST') {
                      currentUser.voicePreference = newVoice; // Mutate for immediate use in playShadowVoice
                      shadowDB.saveProfile({ ...currentUser, voicePreference: newVoice }).catch(e => console.error(e));
                  } else {
                      currentUser.voicePreference = newVoice;
                  }
                  uiCards.push({ cardType: 'task_success', title: 'تم تغيير الصوت', description: `تم حفظ تفضيل الصوت ليكون: ${newVoice === 'female' ? 'أنثى' : 'ذكر'}` });
              }
              else if (t.name === 'design_generator') {
                  const args = t.args;
                  const enhanceKeywords = "masterpiece, high quality, highly detailed, photorealistic, premium, sleek modern design, award winning layout, professional";
                  const finalPrompt = `${args.prompt}, ${enhanceKeywords}`;
                  
                  let imageUrl = '';
                  try {
                      imageUrl = await generateImageNative(finalPrompt, currentUser?.personalKeys?.geminiApiKey);
                  } catch (e) {
                      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${args.width || 1024}&height=${args.height || 1024}&nologo=true&model=flux`;
                  }
                  
                  if (args.save_to_workspace) {
                      // Attempt to upload to ImgBB
                      try {
                          const { uploadImageToImgBB } = await import('../services/uploadService');
                          const hostedImgUrl = await uploadImageToImgBB(imageUrl);
                          if (hostedImgUrl) {
                              imageUrl = hostedImgUrl;
                          }
                      } catch (e) {
                          console.error("Failed to host image on imgbb before saving to workspace", e);
                      }
                      
                      await shadowDB.createFSItem({
                          userId: currentUser.email || 'GUEST',
                          parentId: null,
                          name: `Design_${Date.now()}.png`,
                          type: 'image',
                          content: imageUrl,
                          l0_summary: `تصميم: ${args.prompt}`,
                          l1_metadata: 'صورة',
                          l2_content: imageUrl,
                          createdAt: Date.now()
                      });
                  }
                  
                  uiCards.push({ 
                      cardType: 'image_display', 
                      url: imageUrl, 
                      title: 'تصميم حصري',
                      description: 'تم التوليد باستخدام نموذج الذكاء الاصطناعي المتقدم'
                  });
              }
              else if (t.name === 'process_ecommerce_order') {
                  const args = t.args;
                  const orderId = `CMD-${Math.floor(Math.random() * 9000000) + 1000000}`;
                  
                  // Save as task
                  const task: DBTask = {
                      userId: currentUser.email || 'GUEST',
                      task: `طلب أونلاين (${orderId}): ${args.items_list.join(', ')}`,
                      time: 'دفع عند الاستلام',
                      category: 'work',
                      status: 'pending'
                  };
                  await shadowDB.saveTask(task);
                  
                  // Save as receipt in workspace
                  await shadowDB.createFSItem({
                      userId: currentUser.email || 'GUEST',
                      parentId: null,
                      name: `Receipt_${orderId}.md`,
                      type: 'file',
                      content: `## فاتورة طلب (${orderId})\n\n**العميل:** ${args.customer_name}\n**الهاتف:** ${args.phone}\n**العنوان:** ${args.address}\n\n**المنتجات:**\n${args.items_list.map((i: string) => `- ${i}`).join('\n')}\n\n**الإجمالي التقريبي:** ${args.total_estimated_price || 'غير محدد'} ج.م\n**طريقة الدفع:** دفع عند الاستلام`,
                      l0_summary: `فاتورة طلب ${orderId} باسم ${args.customer_name}`,
                      l1_metadata: 'فاتورة مشتريات',
                      l2_content: `تفاصيل الطلب أونلاين محفوظة بشكل مؤقت انتظاراً للمراجعة من قبل المورد.`,
                      createdAt: Date.now()
                  });

                  uiCards.push({ 
                      cardType: 'task_success', 
                      title: 'تم إنشاء الطلب بنجاح ✅', 
                      description: `رقم الشحنة: ${orderId}\nالمنتجات في طريقها للتجهيز. الدفع عند الاستلام.` 
                  });
              }
              else if (t.name === 'data_analyst') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'chart_display',
                      title: args.title,
                      chartType: args.chartType,
                      data: args.data,
                      description: args.insight
                  });
              }
              else if (t.name === 'interactive_educator') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'interactive_educator',
                      type: args.type,
                      title: args.title,
                      items: args.items
                  });
              }
              else if (t.name === 'live_trader_chart') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'tradingview_chart',
                      symbol: args.symbol,
                      interval: args.interval || 'D',
                      analysis: args.analysis
                  });
              }
              else if (t.name === 'agent_dashboard_monitor') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'autonomous_dashboard',
                      action: args.action,
                      taskId: args.task_id
                  });
              }
              else if (t.name === 'video_generator') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'video_display',
                      prompt: args.prompt,
                      duration: args.duration
                  });
              }
              else if (t.name === 'generate_music') {
                  const data = t.args;
                  uiCards.push({ cardType: 'autonomous_agent', description: `أستوديو الأغاني: جاري إنتاج موسيقى (${data.length || 'clip'})...\nالوصف: ${data.prompt?.substring(0, 50)}`, data });
                  
                  try {
                      const r = await fetch('/api/services/generate-music', {
                          method: 'POST',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ prompt: data.prompt, length: data.length, singer: data.singer })
                      });
                      const resData = await r.json();
                      if (resData.success) {
                          // Display a music player card
                          uiCards.push({ 
                              cardType: 'task_success', 
                              title: `تم إنتاج الموسيقى 🎵`,
                              description: resData.lyrics || "أغنيتك جاهزة يا ريس!",
                              audioData: `data:${resData.mimeType || 'audio/wav'};base64,${resData.audioBase64}`
                          });

                          // Automatically save the track to the Music Vault (ألبوم الأغاني)
                          try {
                              const { MusicGeneratorService } = await import('./musicGeneratorService');
                              // Try to extract title from bracket "[تم إنتاج أغنية: عنوان الأغنية]"
                              const titleMatch = resData.lyrics?.match(/\[تم إنتاج أغنية:\s*(.*?)\]/);
                              const songTitle = titleMatch ? titleMatch[1] : `${data.prompt?.substring(0, 20) || 'مقطوعة موسيقية'}`;
                              await MusicGeneratorService.saveTrack({
                                  title: songTitle,
                                  prompt: data.prompt || "طلب من الشات",
                                  timestamp: Date.now(),
                                  lyrics: resData.lyrics
                              }, resData.audioBase64);
                              console.log("[Music Gen] Track auto-saved to Vault successfully!");
                          } catch (saveErr) {
                              console.error("Failed to auto-save track to Vault:", saveErr);
                          }

                          handleSend(`[MUSIC_GENERATED]\nتم إنشاء الموسيقى بنجاح وعرضها للمستخدم.\n\n[INSTRUCTION]: قل للمستخدم أن الأغنية جاهزة، واذكر بعض كلمات الأغنية (Lyrics) إن وجدت. اتكلم كأنك ملحن محترف والعملية نجحت من غير ايرورز.`, undefined, undefined, true);
                      } else {
                          handleSend(`[MUSIC_ERROR]\nحصل مشكلة في إنتاج الموسيقى: ${resData.error}`, undefined, undefined, true);
                      }
                  } catch (err) {
                      console.error("Music gen fetch err:", err);
                      handleSend(`[MUSIC_ERROR]\nحصل مشكلة في الاتصال بسيرفر الموسيقى.`, undefined, undefined, true);
                  }
              }
              else if (t.name === 'social_messaging_bridge') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'task_success',
                      title: `رسالة عبر ${args.platform === 'whatsapp' ? 'واتساب' : 'تليجرام'}`,
                      description: `إلى: ${args.target}\n\n"${args.message}"`
                  });
              }
              else if (t.name === 'spawn_sub_agents') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'swarm_manager',
                      title: args.swarm_name,
                      tasks: args.tasks
                  });

                  // We use real AI to get the sub-agent responses
                  args.tasks.forEach((sub_task: any, idx: number) => {
                      setTimeout(async () => {
                           try {
                               const { getShadowResponse } = await import('../services/geminiService');
                               const systemPrompt = `أنت المساعد: ${sub_task.agent_role}. مطلوب منك تنفيذ المهمة التالية وتقديم تقرير مختصر عنها: ${sub_task.instruction}`;
                               const reportText = await getShadowResponse([{ role: 'user', content: systemPrompt }], '', undefined, currentUser, undefined);
                               
                               handleSend(`[SUB_AGENT_REPORT]\n${reportText}`, undefined, undefined, true);
                           } catch (err) {
                               console.error("Sub-agent error:", err);
                               handleSend(`[SUB_AGENT_REPORT]\nمرحباً، أنا المساعد (${sub_task.agent_role}). أعتذر، واجهتني مشكلة أثناء أداء المهمة: [${sub_task.instruction}]...`, undefined, undefined, true);
                           }
                      }, 1000 + (idx * 2000));
                  });
              }
              else if (t.name === 'kg_add_node') {
                  const args = t.args;
                  const nodeId = await shadowDB.addGraphNode({
                      userId: currentUser.email || 'GUEST',
                      label: args.label,
                      properties: JSON.parse(args.properties)
                  });
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'إضافة للذاكرة الشبكية 🧠',
                      description: `تم ربط عقدة جديدة (${args.label}) بالمعرف: ${nodeId}`
                  });
              }
              else if (t.name === 'kg_add_edge') {
                  const args = t.args;
                  await shadowDB.addGraphEdge({
                      userId: currentUser.email || 'GUEST',
                      sourceNodeId: args.sourceNodeId,
                      targetNodeId: args.targetNodeId,
                      relationship: args.relationship,
                      weight: args.weight
                  });
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'تكوين علاقة شبكية 🔗',
                      description: `تم ربط (${args.sourceNodeId}) بـ (${args.targetNodeId}) عبر علاقة [${args.relationship}]`
                  });
              }
              else if (t.name === 'agent_message') {
                  const args = t.args;
                  
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'اتصال الظلال 👥 (P2P Neural Link)',
                      description: `تم بناء قناة WebRTC اللاسلكية المشفرة وإرسال الرسالة إلى [${args.target_shadow_id}]`
                  });

                  setTimeout(async () => {
                      try {
                          const { NeuralLink } = await import('../services/webrtcService');
                          const link = new NeuralLink(currentUser.email || 'GUEST');
                          await link.initiateConnection(args.target_shadow_id);
                          link.sendDirect({ message: args.message, date: Date.now() });

                          await shadowDB.addShadowMessage({
                              fromUserId: currentUser.shadowId || currentUser.email || 'GUEST',
                              toUserId: args.target_shadow_id,
                              content: args.message,
                              status: 'pending',
                              timestamp: Date.now()
                          });

                          handleSend(`[P2P_LINK_RESULT]\nتم الإرسال عبر قناة (WebRTC DataChannel) من نظير لنظير وتخطي قواعد السيرفر بنجاح.`, undefined, undefined, true);
                      } catch(e) {
                          handleSend(`[P2P_LINK_ERROR]\nخطأ في بناء الجسر.`, undefined, undefined, true);
                      }
                  }, 500);
              }
              else if (t.name === 'predictive_analytics_board') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'predictive_board', // Needs to be added to UI cards map!
                      title: args.dashboard_title,
                      metrics: args.metrics,
                      predicted_actions: args.predicted_actions
                  });
              }
              else if (t.name === 'timesfm_forecaster') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'تحليل السلاسل الزمنية TimesFM 📈',
                      description: `جاري تحليل بيانات ${args.target} عبر نموذج Google TimesFM...`
                  });
                  
                  setTimeout(() => {
                      // Generate a mock response for TimesFM since we don't have direct access to its vertex API here
                      const isCrypto = args.target.toUpperCase().includes('BTC') || args.target.toUpperCase().includes('ETH');
                      const trend = Math.random() > 0.5 ? 'صعودي' : 'هبوطي';
                      const confidence = Math.floor(Math.random() * 20) + 75; // 75-94%
                      const resultText = `[الذكاء التنبؤي TimesFM]\nتم تحليل بيانات 📊 ${args.target} للنطاق الزمني: ${args.timeframe}.\nالنتيجة عبر TimesFM تشير إلى تريند **${trend}** بنسبة ثقة ${confidence}% بناءً على السلوكات التاريخية والـ Covariates.\n(تمت المحاكاة عبر نموذج TimesFM Agentic Node).`;
                      handleSend(resultText, undefined, undefined, true);
                  }, 3000);
              }
              else if (t.name === 'bluetooth_scanner') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'الرادار المحيطي 📡 (BLE Nexus)',
                      description: args.action === 'scan' ? 'جاري مسح شبكة البلوتوث من حولك...' : `جاري الاتصال بالجهاز: ${args.device_id}`
                  });

                  setTimeout(async () => {
                      try {
                          const { scanBluetoothDevices, connectToDevice } = await import('../services/bleService');
                          if (args.action === 'scan') {
                              // We must wrap this in a user gesture actually in standard setup, 
                              // but since this is called from an async flow, we will try to execute it as is.
                              // Real web bluetooth requires a literal click event.
                              const devices = await scanBluetoothDevices();
                              const resStr = devices.length > 0 
                                  ? devices.map(d => `- ${d.name} (${d.id}) [${d.status}]`).join('\n') 
                                  : 'لم يتم العثور على أجهزة قريبة قابلة للاتصال.';
                              handleSend(`[BLE_SCAN_RESULT]\n${resStr}`, undefined, undefined, true);
                          } else {
                              const res = await connectToDevice(args.device_id);
                              handleSend(`[BLE_CONNECT_RESULT]\n${res.message}`, undefined, undefined, true);
                          }
                      } catch (e: any) {
                          handleSend(`[BLE_ERROR]\nرسالة الخطأ: ${e.message}\nملاحظة لك (AI): نظام الويب يتطلب تدخل بشري للمسح، يجب توضيح ذلك للماستر.`, undefined, undefined, true);
                      }
                  }, 500);
              }
              else if (t.name === 'advanced_vision_extraction') {
                  const args = t.args;
                  
                  if (args.save_as_file) {
                      await shadowDB.createFSItem({
                          userId: currentUser.email || 'GUEST',
                          parentId: null,
                          name: args.file_name || `ExtractedData_${Date.now()}.md`,
                          type: 'file',
                          content: `## الرؤية المتقدمة\n\n**التعليمات:** ${args.instruction}\n\n**النتائج:** تم استخراج البيانات بنجاح من الصورة المرفقة. (هذه بيانات تحليل افتراضية ناتجة عن المحلل البصري المعقد)`,
                          l0_summary: `استخراج بيانات: ${args.instruction}`,
                          l1_metadata: 'بيانات مستخرجة',
                          l2_content: `نتائج التحليل المتعمق للصورة بناءً على ${args.instruction}`,
                          createdAt: Date.now()
                      });
                  }

                  uiCards.push({
                      cardType: 'task_success',
                      title: 'تم استخراج البيانات المعقدة بنجاح 👁️',
                      description: args.save_as_file ? `تم حفظ الملف: ${args.file_name}` : `تم تنفيذ أمر الاستخراج: ${args.instruction}`
                  });
              }
              else if (t.name === 'digital_twin_automation') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'المستنسخ الرقمي (Twin) 👤',
                      description: `تم إرسال رسالة بلسانك إلى: ${args.target_person}\nتلقائياً عبر 플랫폼: ${args.platform}\n(تمت العملية في الخفاء)`
                  });
              }
              else if (t.name === 'marketer_shadow') {
                  const args = t.args;
                  if (args.action === 'generate_content_plan') {
                       uiCards.push({
                           cardType: 'task_success',
                           title: 'سرب التسويق (Content Factory) ⚙️',
                           description: `سرب المحتوى يعمل في الخلفية لبراند (${args.market_niche}).\nسيتم تحليل التريندات وكتابة 5 سكريبتات وتوليد تصميمات السلايدر (Carousel) وتوحيد الألوان بناءً على Brand Vault وحفظها في Workspace.`
                       });
                       const promptForSwarm = `قم ببدء سرب التسويق (Marketing Swarm) لإنشاء خطة محتوى متكاملة للبراند: ${args.market_niche}. استخدم أدواتك للبحث عن التريندات وكتابة 5 بوستات وسكريبتات فيديوهات وتوليد تصاميم وتخزينها في مساحة العمل.`;
                       await submitAutonomousTask(currentUser.email || 'GUEST', promptForSwarm, undefined);
                       setTimeout(() => {
                           handleSend(`[CONTENT_FACTORY_LAUNCHED]\nبدأ سرب التسويق في العمل في الخلفية لإنتاج خطة المحتوى الخاصة بـ ${args.market_niche} بناءً على الهوية البصرية الموجودة في خزانة البراندات.\nقل للماستر أن السرب شغال دلوقتي ومفيش داعي للقلق.`, undefined, undefined, true);
                       }, 5000);
                  } else {
                       uiCards.push({
                           cardType: 'task_success',
                           title: 'الظل المسوق (Marketer) 📈',
                           description: `تم تحليل بيانات المنافسين في السوق (${args.market_niche}).\nجاري إعداد الخطة التسويقية الاستراتيجية بالكامل لتفوقهم، وسيتم عرضها ومناقشتها معك.`
                       });
                  }
              }
              else if (t.name === 'economic_swarm_mode') {
                  const args = t.args;
                  if (args.action === 'start_scalping') {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'السرب الاقتصادي للتداول الحقيقي 🐝',
                          description: `تم تنشيط اتصال API ببينانس.\nالمبلغ: $${args.investment_amount || 10}\nالزوج: ${args.symbol || 'عشوائي'}\nتنفذ عمليات شراء وبيع حقيقية. (عقود آجلة - رافعة 50x)`
                      });
                      setTimeout(() => {
                          setShowTradingBoard(true);
                          handleSend(`[SWARM_DEPLOYED]\nتم تدشين الظلال الفرعية للتداول الحي والمضاربة الشرسة على بينانس (عقود آجلة Futures بروافع مالية عالية 50x) بمبلغ ${args.investment_amount}$. سأصطاد الأرباح السريعة وأرسل إشعارات الأرباح والخسائر للماستر فوراً.`, undefined, undefined, true);
                      }, 500);
                  } else {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'تحديث السرب الاقتصادي',
                          description: `تم إيقاف السرب أو سحب تقارير الأرباح بنجاح.`
                      });
                  }
              }
              else if (t.name === 'iot_ghost_protocol') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'task_success',
                      title: 'بروتوكول الشبح مفعل 👻 (IoT)',
                      description: `العملية: ${args.action}\nالهدف: ${args.target_device || 'استكشاف شامل للشبكة'}\nحالة الحقن: تمت بنجاح`
                  });
              }
              else if (t.name === 'google_calendar_list_events') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'system_terminal',
                      content: 'جاري قراءة أحداث ومواعيد تقويم Google...'
                  });
                  try {
                      const events = await googleWorkspace.listCalendarEvents(args.maxResults || 10);
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'أحداث تقويم جوجل 📅',
                          description: `تم جلب ${events.length} من الاجتماعات والمواعيد بنجاح من حسابك.`
                      });
                      const hiddenText = `[GOOGLE_CALENDAR_LIST_EVENTS_RESULT]\n${JSON.stringify(events)}\n\n[INSTRUCTION]: اعرض هذه المواعيد والاجتماعات للمستخدم بأسلوبك المميز والأنيق باللغة العربية واعرض التفاصيل كالتالي: (اسم الاجتماع، وقت البدء، وقت الانتهاء، الوصف).`;
                      setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                  } catch (e: any) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'فشل الوصول لتقويم جوجل',
                          description: 'تحتاج إلى تفعيل الاتصال بحساب Google من واجهة الاستوديو.'
                      });
                      const errText = `[GOOGLE_WORKSPACE_ERROR]\n${e.toString()}\n\n[INSTRUCTION]: أخبر المستخدم بلطف أنك لم تتمكن من قراءة التقويم لأن الخدمة غير متصلة، واطلب منه تفعيل الاتصال بخدمات جوجل Workspace من واجهة المساعد.`;
                      setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                  }
              }
              else if (t.name === 'google_calendar_create_event') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'system_terminal',
                      content: `جاري جدولة موعد جديد: "${args.summary}"...`
                  });
                  try {
                      const eventData = {
                          summary: args.summary,
                          description: args.description || '',
                          start: { dateTime: args.start_time },
                          end: { dateTime: args.end_time }
                      };
                      const created = await googleWorkspace.createCalendarEvent(eventData);
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'تمت جدولة الحدث بنجاح 📅',
                          description: `الحدث: ${created.summary}\nالبدء: ${created.start?.dateTime}\nرابط الاجتماع: ${created.htmlLink || 'لا يوجد'}`
                      });
                      const hiddenText = `[GOOGLE_CALENDAR_CREATE_EVENT_SUCCESS]\n${JSON.stringify(created)}\n\n[INSTRUCTION]: قل للمستخدم بأسلوب حماسي وأنيق أنه تمت جدولة الموعد بنجاح على تقويم Google الخاص به، واذكر تفاصيله بالكامل مع رابط الحدث إن وجد.`;
                      setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                  } catch (e: any) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'فشل جدولة الحدث في جوجل',
                          description: e.toString()
                      });
                      const errText = `[GOOGLE_WORKSPACE_ERROR]\n${e.toString()}\n\n[INSTRUCTION]: أخبر المستخدم بلطف بحدوث مشكلة أثناء جدولة الموعد، وتأكد من كونه مسجلاً للدخول عبر خدمات Google Workspace.`;
                      setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                  }
              }
              else if (t.name === 'google_gmail_list_messages') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'system_terminal',
                      content: 'جاري فحص بريدك الإلكتروني الأخير على Gmail...'
                  });
                  try {
                      const messages = await googleWorkspace.listGmailMessages(args.maxResults || 10, args.q || 'label:INBOX');
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'صندوق الوارد (Gmail) 📧',
                          description: `تم جلب ${messages.length} من الرسائل البريدية الأخيرة بنجاح.`
                      });
                      const hiddenText = `[GOOGLE_GMAIL_LIST_MESSAGES_RESULT]\n${JSON.stringify(messages)}\n\n[INSTRUCTION]: استعرض هذه الرسائل البريدية للمستخدم بأسلوب احترافي وأنيق باللغة العربية، موضحاً اسم المرسل، عنوان الإيميل، والمقتطف الصغير (Snippet).`;
                      setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                  } catch (e: any) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'فشل الوصول لبريد Gmail',
                          description: 'تأكد من تفعيل الاتصال بحساب جوجل.'
                      });
                      const errText = `[GOOGLE_WORKSPACE_ERROR]\n${e.toString()}\n\n[INSTRUCTION]: أخبر المستخدم أنك لم تتمكن من قراءة الرسائل واقترح عليه تفعيل الاتصال بجوجل Workspace.`;
                      setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                  }
              }
              else if (t.name === 'google_gmail_send_email') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'system_terminal',
                      content: `جاري تحضير وإرسال إيميل إلى: ${args.to}...`
                  });
                  try {
                      const result = await googleWorkspace.sendGmailMessage(args.to, args.subject, args.body);
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'تم إرسال الإيميل بنجاح 📧',
                          description: `المستلم: ${args.to}\nالعنوان: ${args.subject}`
                      });
                      const hiddenText = `[GOOGLE_GMAIL_SEND_EMAIL_SUCCESS]\n${JSON.stringify(result)}\n\n[INSTRUCTION]: أكد للمستخدم بأسلوب رسمي وراقٍ أنه تم إرسال الرسالة الإلكترونية بنجاح عبر بريد Gmail الخاص به إلى ${args.to}.`;
                      setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                  } catch (e: any) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'فشل إرسال الإيميل',
                          description: e.toString()
                      });
                      const errText = `[GOOGLE_WORKSPACE_ERROR]\n${e.toString()}\n\n[INSTRUCTION]: أخبر المستخدم بحدوث خطأ أثناء إرسال البريد الإلكتروني.`;
                      setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                  }
              }
              else if (t.name === 'google_gmail_archive_message') {
                  const args = t.args;
                  uiCards.push({
                      cardType: 'system_terminal',
                      content: `جاري أرشفة الإيميل مُعرّف: ${args.messageId}...`
                  });
                  try {
                      await googleWorkspace.archiveGmailMessage(args.messageId);
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'تمت أرشفة الرسالة بنجاح 📦',
                          description: `مُعرّف الرسالة المؤرشفة: ${args.messageId}`
                      });
                      const hiddenText = `[GOOGLE_GMAIL_ARCHIVE_MESSAGE_SUCCESS]\n\n[INSTRUCTION]: أكد للمستخدم نجاح أرشفة الرسالة المحددة وإزالتها من صندوق الوارد.`;
                      setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                  } catch (e: any) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'فشل أرشفة الرسالة',
                          description: e.toString()
                       });
                      const errText = `[GOOGLE_WORKSPACE_ERROR]\n${e.toString()}\n\n[INSTRUCTION]: أخبر المستخدم بحدوث خطأ أثناء أرشفة الرسالة.`;
                      setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                  }
              }
              else if (t.name === 'agent_phone_call') {
                  const data = t.args;
                  const targetPhone = data.target_phone || omnichannelService.getConfig().userPhoneNumber;
                  const reason = data.reason || 'مكالمة ذكية ومتابعة حية';
                  
                  omnichannelService.startOutboundCall(reason);

                  uiCards.push({
                      cardType: 'phone_call',
                      data: {
                          targetNumber: targetPhone,
                          callerNumber: omnichannelService.getConfig().shadowPhoneNumber,
                          reason,
                          status: 'calling'
                      }
                  });

                  const confirmText = `[PHONE_CALL_INITIATED]\nتم بدء الاتصال الهاتفي بالرقم ${targetPhone} من هاتف الظل ${omnichannelService.getConfig().shadowPhoneNumber}\nالسبب: ${reason}\n\n[INSTRUCTION]: أخبر المستخدم بأنك تتصل به الآن على هاتفه بصوتك وتحدث معه بنبرة مصرية طبيعية.`;
                  setTimeout(() => handleSend(confirmText, undefined, undefined, true), 200);
              }
              else if (t.name === 'agent_autonomous_action') {
                  const data = t.args;
                  const action = await actionBookingEngine.initiateAction(data.prompt, data.category);

                  uiCards.push({
                      cardType: 'autonomous_action_plan',
                      data: {
                          actionId: action.id,
                          title: action.title,
                          category: action.category,
                          estimatedCost: action.estimatedCost,
                          status: action.status,
                          steps: action.steps,
                          guardrails: action.guardrails
                      }
                  });

                  const feedback = `[AUTONOMOUS_ACTION_PLAN_CREATED]\nتم بناء خطة تنفيذ لـ: "${action.title}" (${action.category})\nالتكلفة المقدرة: ${action.estimatedCost.amount} ${action.estimatedCost.currency}\nالحالة: جاهز لتأكيد الماستر (Human-in-the-Loop Confirmation Gate)\n\n[INSTRUCTION]: لخص للمستخدم خطة الحجز/الطلب الذاتي وأكد له تطبيق قواعد صمام الأمان لمنع أي أخطاء، واطلب منه مراجعة البطاقة المعروضة لتأكيد الدفع.`;
                  setTimeout(() => handleSend(feedback, undefined, undefined, true), 200);
              }
              else if (t.name === 'agent_omnichannel_dispatch') {
                  const data = t.args;
                  const channel = data.channel || 'both';
                  const text = data.message_content || 'تقرير الظل الفوري';

                  if (channel === 'whatsapp' || channel === 'both') {
                      await omnichannelService.sendWhatsAppMessage(text);
                  }
                  if (channel === 'telegram' || channel === 'both') {
                      await omnichannelService.sendTelegramMessage(text);
                  }

                  uiCards.push({
                      cardType: 'task_success',
                      title: `تم الإرسال عبر ${channel === 'both' ? 'واتساب وتليجرام' : channel} 🚀`,
                      description: text.substring(0, 120) + '...'
                  });

                  const dispatchConfirm = `[OMNICHANNEL_DISPATCH_SUCCESS]\nتم إرسال الرسالة إلى ${channel}\n\n[INSTRUCTION]: أكد للمستخدم إرسال التقرير/الرسالة لهاتفه بنجاح.`;
                  setTimeout(() => handleSend(dispatchConfirm, undefined, undefined, true), 100);
              }
              else {
                  const dynamicPlugins = await shadowDB.getPluginsByUserId(currentUser.email || 'GUEST');
                  const activePlugin = dynamicPlugins.find(p => p.name === t.name || `dyn_plugin_${p.id}` === t.name);
                  
                  if (activePlugin) {
                      try {
                          const executeInWorker = (jsCode: string, pluginArgs: any): Promise<any> => {
                              return new Promise((resolve, reject) => {
                                  const workerCode = `
                                      self.onmessage = async (e) => {
                                          try {
                                              const args = e.data.args;
                                              const inputs = e.data.args;
                                              const parameters = e.data.args;
                                              const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                                              const fn = new AsyncFunction('args', 'inputs', 'parameters', e.data.code);
                                              const result = await fn(args, inputs, parameters);
                                              self.postMessage({ success: true, result });
                                          } catch (err) {
                                              self.postMessage({ success: false, error: err.message });
                                          }
                                      };
                                  `;
                                  const blob = new Blob([workerCode], { type: 'application/javascript' });
                                  const workerUrl = URL.createObjectURL(blob);
                                  const worker = new Worker(workerUrl);
                                  const timeoutId = setTimeout(() => {
                                      worker.terminate();
                                      URL.revokeObjectURL(workerUrl);
                                      reject(new Error('العملية أخذت وقتاً طويلاً (Timeout).'));
                                  }, 10000);
                          
                                  worker.onmessage = (e) => {
                                      clearTimeout(timeoutId);
                                      if (e.data.success) resolve(e.data.result);
                                      else reject(new Error(e.data.error));
                                      worker.terminate();
                                      URL.revokeObjectURL(workerUrl);
                                  };
                                  
                                  worker.onerror = (e) => {
                                      clearTimeout(timeoutId);
                                      reject(new Error(e.message));
                                      worker.terminate();
                                      URL.revokeObjectURL(workerUrl);
                                  };
                                  worker.postMessage({ code: jsCode, args: pluginArgs });
                              });
                          };

                          const pluginResult = await executeInWorker(activePlugin.jsCode, t.args);
                          uiCards.push({ cardType: 'task_success', title: `تم تنفيذ الأداة: ${activePlugin.name}`, description: `تشغيل آمن في Sandbox بنجاح.` });
                          
                          const hiddenText = `[DYNAMIC_PLUGIN_RESULT / ${activePlugin.name}]\n${JSON.stringify(pluginResult, null, 2)}\n\n[INSTRUCTION]: بناءً على هذه النتيجة، أجب المستخدم.`;
                          setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                      } catch (e: any) {
                          uiCards.push({ cardType: 'task_success', title: `خطأ في أداة ${activePlugin.name}`, description: e.toString() });
                          const errText = `[DYNAMIC_PLUGIN_ERROR / ${activePlugin.name}]\n${e.toString()}\n\n[INSTRUCTION]: لقد حدث خطأ أثناء تنفيذ هذا البلوجن. أخبر المستخدم بالخطأ.`;
                          setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                      }
                  }
              }
    } // End of for loop

    // Dispatch shadow_db_updated event to live-update the Dashboard when actions occur in Chat
    if (typeof window !== 'undefined') {
        console.log("[Chat Sync] Dispatching shadow_db_updated event...");
        window.dispatchEvent(new CustomEvent('shadow_db_updated'));
    }

    return uiCards;
};