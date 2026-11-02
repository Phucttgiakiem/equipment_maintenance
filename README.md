# Enterprise Equipment Maintenance Management System - Frontend

> ** Notice on Live Demo:** The cloud server/VPS deployment for this project is currently suspended due to hosting expiration. However, the complete codebase, Docker setup, and GitHub Actions CI/CD workflows remain fully functional for local testing and code review. Follow the instructions below to run the project locally.

---

## Overview
An internal full-stack web application designed for enterprise equipment management, featuring internal access control and maintenance scheduling workflows. Engineered and optimized using **Claude Code** as an AI development assistant.

---

## Features
* **Internal Authentication & Role-Based Access Control (RBAC):** Secure login and route authorization handling.
* **Equipment Tracking & Inventory Management:** Real-time asset monitoring and status updates.
* **Maintenance Workflows:** Automated scheduling, status tracking, and cancellation operations.
* **Service History & Audit Logs:** Detailed tracking of historical maintenance records.
* **Containerized Deployment:** Fully dockerized application structure using Docker & Docker Compose.
* **Automated CI/CD Pipeline:** Integrated GitHub Actions for continuous integration and automated build checks.

---

## Tech Stack
* **Frontend Framework:** Next.js, Redux Toolkit, React Query / Axios
* **Styling:** Tailwind CSS
* **DevOps & Infrastructure:** Docker, Docker Compose, GitHub Actions (CI/CD)
* **AI Tooling:** Claude Code (CLI AI Development Assistant)

---

## Environment Variables (.env)
Create a `.env.local` file in the root directory and define the following variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_ENV=development

## Getting Started (Local Setup)

You can run this project locally using either **Docker** or standard **Node.js**.

### Option 1: Running with Docker (Recommended)

Ensure you have **Docker Desktop** installed and running on your machine.

```bash
# 1. Clone the repository
git clone [https://github.com/](https://github.com/)[your-github-username]/[your-repo-name].git
cd [your-repo-name]

# 2. Build and start the container
docker-compose up --build
