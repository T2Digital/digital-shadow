# إعداد الكود الأصلي لنظام Android (Native Bridge)

الهدف من هذه الملفات هو تشغيل "الظل" كخدمة في الخلفية (Foreground Service) والوصول إلى نظام Accessibility لتوفير "الاستمرارية 24/7" و "الإدراك البصري".

## التعليمات بعد استخراج المشروع:

1. انسخ ملفات الجافا (`MainActivity.java`, `ShadowService.java`, `ShadowAccessibilityService.java`) إلى مجلد مشروع Android الخاص بك (مسار `android/app/src/main/java/com/shadow/app/`).

2. تحديث `AndroidManifest.xml`:
يجب عليك إضافة التراخيص والإعلانات التالية داخل ملف `AndroidManifest.xml` الخاص بتطبيقك (داخل `<application>`):

```xml
<!-- التراخيص المطلوبة لتشغيل الخدمة ومعرفة الشاشة -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />

<application>
    ...
    <!-- تسجيل خدمة Android Foreground -->
    <service
        android:name=".ShadowService"
        android:enabled="true"
        android:exported="true"
        android:foregroundServiceType="connectedDevice" />

    <!-- تسجيل خدمة الـ Accessibility للإدراك البصري (Screen Awareness) -->
    <service
        android:name=".ShadowAccessibilityService"
        android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
        android:exported="true">
        <intent-filter>
            <action android:name="android.accessibilityservice.AccessibilityService" />
        </intent-filter>
        <meta-data
            android:name="android.accessibilityservice"
            android:resource="@xml/accessibility_service_config" />
    </service>
</application>
```

3. قم بإنشاء ملف إعداد الـ Accessibility (في مجلد `android/app/src/main/res/xml/accessibility_service_config.xml`):

```xml
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_description" />
```

4. أعد بناء تطبيق الأندرويد من خلال أمر:
```bash
npx cap sync android
```
ثم افتحه على Android Studio.
