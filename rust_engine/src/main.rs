use std::io::{self, Read};

use hemotask_engine::{assign_task, AssignmentInput};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();

    let parsed: AssignmentInput = match serde_json::from_str(&input) {
        Ok(v) => v,
        Err(_) => {
            println!(
                "{}",
                serde_json::json!({
                    "assigned_to": null,
                    "error": "Invalid input"
                })
            );
            return;
        }
    };

    let result = assign_task(parsed);
    println!("{}", serde_json::to_string(&result).unwrap());
}
