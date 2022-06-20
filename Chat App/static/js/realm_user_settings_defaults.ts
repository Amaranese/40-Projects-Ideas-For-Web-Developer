export type RealmDefaultSettingsType = {
    color_scheme: number;
    default_language: string;
    default_view: string;
    desktop_icon_count_display: number;
    demote_inactive_streams: number;
    dense_mode: boolean;
    email_notifications_batching_period_seconds: number;
    emojiset: string;
    enable_desktop_notifications: boolean;
    enable_digest_emails: boolean;
    enable_drafts_synchronization: boolean;
    enable_login_emails: boolean;
    enable_marketing_emails: boolean;
    enable_offline_push_notifications: boolean;
    enable_offline_email_notifications: boolean;
    enable_online_push_notifications: boolean;
    enable_sounds: boolean;
    enable_stream_audible_notifications: boolean;
    enable_stream_desktop_notifications: boolean;
    enable_stream_email_notifications: boolean;
    enable_stream_push_notifications: boolean;
    enter_sends: boolean;
    escape_navigates_to_default_view: boolean;
    fluid_layout_width: boolean;
    high_contrast_mode: boolean;
    left_side_userlist: boolean;
    message_content_in_email_notifications: boolean;
    notification_sound: string;
    pm_content_in_desktop_notifications: boolean;
    presence_enabled: boolean;
    realm_name_in_notifications: boolean;
    starred_message_counts: boolean;
    translate_emoticons: boolean;
    display_emoji_reaction_users: boolean;
    twenty_four_hour_time: boolean;
    wildcard_mentions_notify: boolean;
};

export let realm_user_settings_defaults = {} as RealmDefaultSettingsType;

export function initialize(params: Record<string, RealmDefaultSettingsType>): void {
    realm_user_settings_defaults = params.realm_user_settings_defaults;
}
