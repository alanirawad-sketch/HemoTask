# HemoTask

HemoTask is a blood bank technician workflow management system designed to
improve task distribution, workload balance, and traceability in busy
laboratory environments.

# Motivation

Blood banks operate under high pressure with multiple technicians performing
parallel tasks of varying urgency and complexity. Manual task coordination
can lead to workload imbalance, delays, and increased risk of human error.

This project is based on real-world blood bank experience and aims to model
a safer, more transparent workflow using health informatics principles.

# Problem Statement

In crowded blood bank environments:
- Tasks are distributed manually
- Technician workload is difficult to track
- Emergency tasks compete with routine work
- Accountability relies on paper or fragmented systems

HemoTask addresses these issues through structured task management and
rule-based assignment.

# System Architecture

HemoTask follows a three-layer architecture:

- Frontend: HTML, CSS, JavaScript
- Backend: Python (FastAPI)
- Assignment Engine: Rust

The backend acts as the single source of truth, while Rust is used for
safety-critical task assignment decisions.

# Core Features

- Skill-based task assignment
- Workload-balanced technician selection
- Emergency task prioritization
- Shift-aware availability
- Strict task lifecycle enforcement
- Immutable audit logging

# Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python (FastAPI)
- Logic Engine: Rust
- Storage: JSON (prototype)
- Version Control: GitHub

# GDPR & Ethical Considerations

HemoTask does not process real patient data. All identifiers are anonymized,
and the system is designed to demonstrate workflow logic rather than clinical
decision-making.

Audit logs are append-only, reflecting regulatory traceability requirements
in laboratory environments.

# Future Improvements

- Database integration (PostgreSQL)
- Real authentication and role-based access
- Statistical workload analysis
- Integration with LIS systems

