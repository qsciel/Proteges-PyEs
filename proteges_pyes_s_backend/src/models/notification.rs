use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
pub struct RegisterTokenRequest {
    pub student_id: String,
    pub token: String,
    pub device_name: Option<String>,
}

#[derive(Serialize)]
pub struct NotificationResponse {
    pub message: String,
}
