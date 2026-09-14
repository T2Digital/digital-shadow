# دليل إعداد خدمة التحكم العميق (Accessibility Service) لـ "الظل"

لكي يتمكن "الظل" من التحكم في التطبيقات الأخرى (مثل فتح أوبر، كتابة رسالة في واتساب، أو الضغط على الأزرار)، نحتاج إلى تفعيل `AccessibilityService` في نظام أندرويد.

بما أننا نعمل عبر Capacitor، سنقوم بإنشاء "جسر" (Plugin) يربط بين كود الجافاسكريبت (React) وكود الجافا (Android).

عندما تقوم بتصدير (Export) هذا المشروع وفتحه باستخدام **Android Studio**، اتبع هذه الخطوات بدقة:

## الخطوة الأولى: إنشاء ملف إعدادات الخدمة (XML)
في Android Studio، اذهب إلى المسار:
`android/app/src/main/res/xml/`
(إذا لم يكن مجلد `xml` موجوداً، قم بإنشائه).
أنشئ ملفاً باسم `shadow_accessibility_config.xml` وضع فيه هذا الكود:

```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged|typeViewClicked"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagIncludeNotImportantViews"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true"
    android:description="@string/accessibility_service_description" />
```
*(ملاحظة: أضف `<string name="accessibility_service_description">خدمة الظل للتحكم الذكي في الهاتف</string>` في ملف `res/values/strings.xml`)*

## الخطوة الثانية: إنشاء كود الخدمة (Java)
في المسار:
`android/app/src/main/java/com/shadow/agent/`
أنشئ ملفاً باسم `ShadowAccessibilityService.java` وضع فيه هذا الكود:

```java
package com.shadow.agent;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.os.Bundle;
import android.util.Log;

public class ShadowAccessibilityService extends AccessibilityService {
    
    private static final String TAG = "ShadowAccessibility";
    public static ShadowAccessibilityService instance;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        Log.d(TAG, "Shadow Accessibility Service Connected!");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // هنا يمكننا قراءة ما يحدث على الشاشة إذا أردنا
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Service Interrupted");
    }

    // دالة للبحث عن نص معين والضغط عليه
    public boolean clickOnText(String text) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return false;

        return findAndClickNodeByText(rootNode, text);
    }

    private boolean findAndClickNodeByText(AccessibilityNodeInfo node, String text) {
        if (node == null) return false;

        if (node.getText() != null && node.getText().toString().toLowerCase().contains(text.toLowerCase())) {
            if (node.isClickable()) {
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                return true;
            } else {
                // إذا لم يكن قابلاً للضغط، نضغط على العنصر الأب (Parent)
                AccessibilityNodeInfo parent = node.getParent();
                while (parent != null) {
                    if (parent.isClickable()) {
                        parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return true;
                    }
                    parent = parent.getParent();
                }
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            if (findAndClickNodeByText(node.getChild(i), text)) {
                return true;
            }
        }
        return false;
    }
    
    // دالة لكتابة نص في حقل إدخال
    public boolean writeTextInField(String targetHint, String textToWrite) {
        // يمكن برمجتها للبحث عن حقل إدخال (EditText) وكتابة النص فيه
        return false;
    }
}
```

## الخطوة الثالثة: تسجيل الخدمة في AndroidManifest.xml
افتح ملف `android/app/src/main/AndroidManifest.xml` وأضف هذا الكود داخل وسم `<application>`:

```xml
<service
    android:name=".ShadowAccessibilityService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/shadow_accessibility_config" />
</service>
```

## الخطوة الرابعة: إنشاء جسر Capacitor (Plugin)
في نفس مجلد الجافا `com/shadow/agent/`، أنشئ ملف `ShadowPlugin.java`:

```java
package com.shadow.agent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShadowNative")
public class ShadowPlugin extends Plugin {

    @PluginMethod
    public void clickOnScreen(PluginCall call) {
        String targetText = call.getString("targetText");
        
        if (ShadowAccessibilityService.instance != null) {
            boolean success = ShadowAccessibilityService.instance.clickOnText(targetText);
            if (success) {
                call.resolve();
            } else {
                call.reject("لم يتم العثور على النص أو الزر على الشاشة.");
            }
        } else {
            call.reject("خدمة Accessibility غير مفعلة. يرجى تفعيلها من إعدادات الهاتف.");
        }
    }
}
```

ثم قم بتسجيل البلوجن في `MainActivity.java`:
```java
package com.shadow.agent;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(ShadowPlugin.class);
    }
}
```

## الخطوة الخامسة: استدعاء الكود من React
في ملف `services/deviceService.ts`، يمكنك الآن استدعاء هذا البلوجن هكذا:

```typescript
import { registerPlugin } from '@capacitor/core';
const ShadowNative = registerPlugin<any>('ShadowNative');

export const clickOnScreenNative = async (text: string) => {
    try {
        await ShadowNative.clickOnScreen({ targetText: text });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
```
