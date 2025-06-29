<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for E-commerce Backend

- This is a modular, production-ready NestJS eCommerce backend using TypeScript.
- Follow clean architecture: core, modules, shared, common, lib, config.
- Use DTOs, services, repositories, and best practices (SOLID, validation, security).
- PostgreSQL (TypeORM) for relational data, MongoDB (Mongoose) for unstructured data, Redis for caching/sessions.
- All features must be thoroughly tested (Jest) and documented (Swagger).
- Each feature module should be self-contained: DTOs, controller, service, entity/model, interfaces.
- Use .env and ConfigService for configuration.
- Use class-validator, class-transformer, helmet, rate-limiter, bcrypt, multer, cloudinary, @nestjs/swagger, etc.
- Do not include any frontend code in this workspace.
