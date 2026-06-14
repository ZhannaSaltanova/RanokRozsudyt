package com.ranokrozsudyt

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.telecom.CallRedirectionService
import android.telecom.PhoneAccountHandle
import androidx.annotation.RequiresApi
import org.json.JSONArray

@RequiresApi(Build.VERSION_CODES.Q)
class CallBlockerService : CallRedirectionService() {

    override fun onPlaceCall(
        handle: Uri,
        initialPhoneAccount: PhoneAccountHandle,
        allowInteractiveResponse: Boolean,
    ) {
        val prefs = getSharedPreferences("ranok_prefs", Context.MODE_PRIVATE)
        val isProtectionOn = prefs.getBoolean("protection_on", false)

        if (!isProtectionOn) {
            placeCallUnmodified()
            return
        }

        val dialedRaw = handle.schemeSpecificPart ?: run {
            placeCallUnmodified()
            return
        }
        val dialedNorm = normalizeNumber(dialedRaw)

        val blockedJson = prefs.getString("blocked_numbers", "[]") ?: "[]"
        try {
            val arr = JSONArray(blockedJson)
            for (i in 0 until arr.length()) {
                val entry = arr.getJSONObject(i)
                val phone = entry.optString("phone", "")
                if (phone.isBlank()) continue
                if (normalizeNumber(phone) == dialedNorm) {
                    prefs.edit()
                        .putString("pending_blocked_id", entry.optString("id", ""))
                        .putString("pending_blocked_name", entry.optString("name", ""))
                        .putString("pending_blocked_reason", entry.optString("reason", ""))
                        .putString("pending_blocked_note", entry.optString("note", ""))
                        .commit()

                    cancelCall()
                    BlockedContactsModule.notifyCallBlocked()

                    startActivity(
                        Intent(this, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                            putExtra("wake_screen", true)
                        },
                    )
                    return
                }
            }
        } catch (_: Exception) {}

        placeCallUnmodified()
    }

    private fun normalizeNumber(phone: String): String {
        val d = phone.replace(Regex("[^\\d]"), "")
        return when {
            d.startsWith("380") && d.length == 12 -> d
            d.startsWith("0") && d.length == 10 -> "380${d.substring(1)}"
            d.length == 9 -> "380$d"
            else -> d
        }
    }
}
