# Personal AI + Google Ecosystem — Master Project Documentation

**Version:** 1.0  
**Status:** Project Source-of-Truth / Blueprint  
**Implementation stage:** Foundation and repository structure

## 1. Purpose

This document is the repository-local master reference for the Personal AI + Google Ecosystem project.

## 2. Scope

The project is a single-user personal AI automation platform combining AI chat, manual control, Google services automation, Google Sheets as the primary database, multiple AI providers with fallback, task execution, logging, and real-time status.

## 3. Platform Boundary

GitHub repository and GitHub Pages provide source control and frontend hosting. Cloudflare Workers provide the backend/API boundary. Google APIs provide connected services and Google Sheets provides the primary data layer.

## 4. Google Services in Scope

Sheets, Drive, Gmail, Calendar, Docs, Forms, Blogger, Generative Language/Gemini API, and Google Maps JavaScript API.

## 5. AI Layer

The architecture includes a provider registry, model registry, routing, quota/availability checks, fallback, and normalized provider responses. Provider availability and free-tier details must be verified during implementation rather than assumed from a static blueprint.

## 6. Core Execution Flow

User Input → Command Parser → Intent Detection → Permission Check → Task Planner → AI Model Router → Tool/API Selector → Execution Engine → Result Formatter → Response.

## 7. Data Layer

The primary logical database is the Google Sheets workbook named **Personal AI System Database**. Planned logical sheets include system_config, tasks, task_results, ai_providers, ai_models, google_services, api_status, activity_logs, error_logs, chat_history, agent_memory, and user_settings.

## 8. Security Rules

No credentials or secrets belong in source control. Sensitive values must remain in runtime secret storage. Permissions must be checked before external tool execution and sensitive values must be filtered from logs and error responses.

## 9. Implementation Rule

A directory or file existing in GitHub is not equivalent to a completed feature. Functional completion requires implementation, integration, security handling, error handling, and validation appropriate to the component.

## 10. Change Control

Architecture-affecting changes should be recorded in `docs/decisions/` or the project decision log before implementation is considered complete.
