package com.worldcup.football;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 必须在 super.onCreate 之前禁用 edge-to-edge
        // Capacitor 默认会在父类中启用 edge-to-edge
        super.onCreate(savedInstanceState);
        disableEdgeToEdge();
    }

    private void disableEdgeToEdge() {
        Window window = getWindow();
        View decorView = window.getDecorView();

        // 1. 清除 FLAG_LAYOUT_NO_LIMITS 标志
        window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);

        // 2. 设置状态栏不透明，内容自动避开
        window.setFlags(0, WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);

        // 3. 使用 WindowInsetsControllerCompat 处理系统栏
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);

        // 4. 让 decorView 尊重系统窗口内边距
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (view, windowInsets) -> {
            // 获取状态栏高度并应用为 padding
            int statusBarHeight = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int navigationBarHeight = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;

            view.setPadding(
                view.getPaddingLeft(),
                statusBarHeight,
                view.getPaddingRight(),
                navigationBarHeight
            );

            // 返回消耗后的内边距
            return WindowInsetsCompat.CONSUMED;
        });

        // 5. 请求应用内边距
        ViewCompat.requestApplyInsets(decorView);
    }
}
