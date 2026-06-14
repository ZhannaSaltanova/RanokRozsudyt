package com.ranokrozsudyt

import android.app.role.RoleManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class BlockedContactsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BlockedContactsModule"

    companion object {
        private var instance: BlockedContactsModule? = null

        fun notifyCallBlocked() {
            instance?.reactApplicationContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onCallBlocked", null)
        }
    }

    init {
        instance = this
    }

    @ReactMethod
    fun syncBlockedList(contacts: ReadableArray, isProtectionOn: Boolean) {
        val prefs = reactApplicationContext
            .getSharedPreferences("ranok_prefs", Context.MODE_PRIVATE)
        val arr = JSONArray()
        for (i in 0 until contacts.size()) {
            val c = contacts.getMap(i) ?: continue
            val phone = c.getString("phone") ?: ""
            if (phone.isBlank()) continue
            arr.put(
                JSONObject().apply {
                    put("id", c.getString("id") ?: "")
                    put("name", c.getString("name") ?: "")
                    put("phone", phone)
                    put("reason", c.getString("reason") ?: "")
                    put("note", c.getString("note") ?: "")
                },
            )
        }
        prefs.edit()
            .putString("blocked_numbers", arr.toString())
            .putBoolean("protection_on", isProtectionOn)
            .apply()
    }

    @ReactMethod
    fun getPendingBlockedCall(promise: Promise) {
        val prefs = reactApplicationContext
            .getSharedPreferences("ranok_prefs", Context.MODE_PRIVATE)
        val id = prefs.getString("pending_blocked_id", "") ?: ""
        if (id.isBlank()) {
            promise.resolve(null)
            return
        }
        val map = Arguments.createMap().apply {
            putString("contactId", id)
            putString("contactName", prefs.getString("pending_blocked_name", "") ?: "")
            putString("contactReason", prefs.getString("pending_blocked_reason", "") ?: "")
            putString("contactNote", prefs.getString("pending_blocked_note", "") ?: "")
        }
        prefs.edit()
            .remove("pending_blocked_id")
            .remove("pending_blocked_name")
            .remove("pending_blocked_reason")
            .remove("pending_blocked_note")
            .apply()
        promise.resolve(map)
    }

    @ReactMethod
    fun isCallRedirectionRoleGranted(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val rm = reactApplicationContext.getSystemService(RoleManager::class.java)
            promise.resolve(rm.isRoleHeld(RoleManager.ROLE_CALL_REDIRECTION))
        } else {
            promise.resolve(false)
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    @ReactMethod
    fun requestCallRedirectionRole(promise: Promise) {
        val rm = reactApplicationContext.getSystemService(RoleManager::class.java)
        if (rm.isRoleHeld(RoleManager.ROLE_CALL_REDIRECTION)) {
            promise.resolve(true)
            return
        }
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("ERROR", "Activity недоступна")
            return
        }
        try {
            activity.startActivityForResult(
                rm.createRequestRoleIntent(RoleManager.ROLE_CALL_REDIRECTION),
                1001,
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message ?: "Не вдалося запросити дозвіл")
        }
    }

    @ReactMethod fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {}
    @ReactMethod fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {}
}
