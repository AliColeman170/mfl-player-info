-- Insert initial sync configuration
INSERT INTO
    "public"."sync_config" (config_key, config_value, description)
VALUES
    (
        'last_player_id_imported',
        0,
        'Last active player ID imported during sync'
    ),
    (
        'last_retired_player_id_imported',
        0,
        'Last retired player ID imported during sync'
    ),
    (
        'last_burned_player_id_imported',
        0,
        'Last burned player ID imported during sync'
    ),
    (
        'last_retired_burned_player_id_imported',
        0,
        'Last retired burned player ID imported during sync'
    ),
    (
        'total_player_count',
        0,
        'Total player count updated after sync'
    ),
    (
        'initial_sync_in_progress',
        1,
        'Initially set sync as in progress'
    )
ON CONFLICT (config_key) DO NOTHING;