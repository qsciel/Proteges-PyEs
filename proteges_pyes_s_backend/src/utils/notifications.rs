use serde_json::json;
use sqlx::{Pool, Row, Sqlite};

pub async fn send_push_notification(
    pool: &Pool<Sqlite>,
    student_id: &str,
    title: &str,
    body: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // 1. Get tokens for student
    let rows = sqlx::query("SELECT token FROM push_tokens WHERE student_id = ?")
        .bind(student_id)
        .fetch_all(pool)
        .await?;

    if rows.is_empty() {
        return Ok(());
    }

    let client = reqwest::Client::new();
    let mut messages = Vec::new();

    for row in rows {
        let token: String = row.get("token");
        // Check if token is valid expo token (starts with ExponentPushToken or similar)
        // Expo simplified sending:
        messages.push(json!({
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": { "student_id": student_id }
        }));
    }

    if messages.is_empty() {
        return Ok(());
    }

    // 2. Send to Expo
    // Limit batch size if needed, but for prototype simpler is fine.
    let res = client
        .post("https://exp.host/--/api/v2/push/send")
        .json(&messages)
        .send()
        .await?;

    if res.status().is_success() {
        println!("Notificaciones enviadas para estudiante {}", student_id);
    } else {
        println!(
            "Error enviando notificaciones para estudiante {}: {:?}",
            student_id,
            res.status()
        );
    }

    Ok(())
}

pub async fn broadcast_emergency_notification(
    pool: &Pool<Sqlite>,
    active: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get ALL tokens
    let rows = sqlx::query("SELECT token FROM push_tokens")
        .fetch_all(pool)
        .await?;

    if rows.is_empty() {
        return Ok(());
    }

    let client = reqwest::Client::new();
    let mut messages = Vec::new();

    let title = if active {
        "⚠️ EMERGENCIA ACTIVADA"
    } else {
        "✅ Emergencia Desactivada"
    };
    let body = if active {
        "Se ha activado el protocolo de emergencia en la escuela via Proteges-PyEs. Por favor manténgase atento."
    } else {
        "El protocolo de emergencia ha sido desactivado. Todo vuelve a la normalidad."
    };

    for row in rows {
        let token: String = row.get("token");
        messages.push(json!({
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "priority": "high",
            "channelId": "emergency-alerts",
        }));
    }

    // Send in one batch (Expo handles up to 100 per request, we assume prototype scale < 100)
    let res = client
        .post("https://exp.host/--/api/v2/push/send")
        .json(&messages)
        .send()
        .await?;

    if res.status().is_success() {
        println!(
            "Notificaciones de emergencia enviadas a {} dispositivos",
            messages.len()
        );
    } else {
        println!(
            "Error enviando notificaciones de emergencia: {:?}",
            res.status()
        );
    }

    Ok(())
}
