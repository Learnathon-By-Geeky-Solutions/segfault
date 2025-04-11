from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.timezone import localtime
from internal_api.models import APIKey


class APIKeyAdmin(admin.ModelAdmin):
    readonly_fields = (
        "key_display",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    )
    list_display = ("name", "is_active", "expires_at_display")

    fieldsets = (
        (None, {"fields": ("name", "key_display", "is_active", "expires_at")}),
        ("Important Dates", {"fields": ("created_at", "updated_at")}),
        ("Other Info", {"fields": ("created_by", "updated_by")}),
    )

    def key_display(self, obj):
        """Display masked API key with only first 5 characters and hash algorithm."""
        if obj.key:
            masked_key = f"{obj.key[:5]}{'*' * 50}"
            return format_html(
                '<span style="font-family:monospace;">algorithm: SHA-256 **************** hash: {}</span>',
                masked_key,
            )
        return "N/A"

    key_display.short_description = "API Key"

    def expires_at_display(self, obj):
        """Display 'never' if expires_at is null."""
        if obj.expires_at is None:
            return "Never"
        return localtime(obj.expires_at).strftime("%Y-%m-%d %H:%M:%S")

    expires_at_display.short_description = "Expires At"

    def save_model(self, request, obj, form, change):
        """Auto-assign created_by, generate API key only when creating, and show raw key once."""
        if not obj.pk:  # If creating a new object
            obj.created_by = request.user
            raw_key, hashed_key = APIKey.generate_key()
            obj.key = hashed_key

            # Save the object first
            super().save_model(request, obj, form, change)

            # Clear any default messages
            storage = messages.get_messages(request)
            for message in storage:
                pass  # Iterating through clears the storage

            # Show raw key only once, and include a copy button with an icon in the success message
            copy_button_html = format_html(
                """
                <span style="display: inline-flex; align-items: center; vertical-align: middle; margin-left: 10px;">
                    <button id="copyButton" onclick="copyToClipboard('{raw_key}')" 
                        style="display: inline-flex; align-items: center; vertical-align: middle; padding: 4px 10px; 
                        background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 4px; 
                        font-weight: 500; cursor: pointer; color: #444; transition: all 0.2s;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; position: relative; margin-right: 4px;">
                            <svg id="copyIcon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                                 style="position: absolute; top: 0; left: 0;">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <svg id="tickIcon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                                 fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                                 style="position: absolute; top: 0; left: 0; display: none;">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </span>
                        Copy
                    </button>
                </span>
                <script>
                    function copyToClipboard(text) {{
                        var textArea = document.createElement("textarea");
                        textArea.value = text;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textArea);

                        // Hide copy icon, show tick icon
                        var copyIcon = document.getElementById("copyIcon");
                        var tickIcon = document.getElementById("tickIcon");
                        copyIcon.style.display = "none";
                        tickIcon.style.display = "inline";

                        // Change button style to show success
                        var button = event.currentTarget;
                        var originalBg = button.style.backgroundColor;
                        var originalBorder = button.style.borderColor;
                        button.style.backgroundColor = "#e8f5e9";
                        button.style.borderColor = "#81c784";

                        // Reset after 2 seconds
                        setTimeout(function() {{
                            copyIcon.style.display = "inline";
                            tickIcon.style.display = "none";
                            button.style.backgroundColor = originalBg;
                            button.style.borderColor = originalBorder;
                        }}, 2000);
                    }}
                </script>
                """,
                raw_key=raw_key,
            )

            # Add only our custom success message with proper alignment
            messages.success(
                request,
                format_html(
                    '<div style="align-items: center;">'
                    'API Key: <span style="font-family: monospace; margin: 0 5px;">{}</span> {}'
                    '<div style="font-weight: bold; color: #f57c00; margin-top: 8px;">'
                    '<i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>'
                    "Important: Store this API key safely. For security reasons, it will not be displayed again."
                    "</div>"
                    "</div>",
                    raw_key,
                    copy_button_html,
                ),
            )
        else:
            # For updates, use the normal save process
            super().save_model(request, obj, form, change)

            # Clear default messages and add our custom update message
            storage = messages.get_messages(request)
            for message in storage:
                pass  # Iterating through clears the storage

            messages.success(request, f"API Key '{obj.name}' was updated successfully.")


admin.site.register(APIKey, APIKeyAdmin)
