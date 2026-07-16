# 🍄 ShroomHarvest

> A Shopify portfolio project featuring a custom Online Store 2.0 theme and a standalone embedded Shopify admin application for intelligent inventory management.

## 📖 Project Overview

**ShroomHarvest** is a Shopify project developed to demonstrate modern Shopify development, full-stack application architecture, and product-focused software design.

The project consists of **two complementary applications** built around the same premium mushroom specialty store concept:

* **Custom Shopify Online Store 2.0 Theme** – A responsive storefront that provides customers with an intuitive shopping experience for premium mushroom products.
* **Smart Inventory Insights** – A standalone Shopify embedded admin application that enables merchants to manage inventory, suppliers, stock movements, and intelligent inventory recommendations.

Although both applications share the same branding and business concept, they were intentionally developed as separate deliverables. The storefront focuses on customer experience and Shopify theme development, while the embedded application demonstrates backend architecture, database design, business logic, and merchant-focused tools.

Rather than implementing only basic CRUD functionality, the embedded application applies product thinking through an **Inventory Health Score** and recommendation engine that assist merchants in making more informed inventory decisions.

The project follows production-oriented software engineering practices including modular architecture, reusable components, responsive design, accessibility considerations, relational database design, Dockerized database services, and comprehensive project documentation.

---

## 🎯 Project Objectives

ShroomHarvest was created to showcase practical Shopify development skills across both storefront customization and merchant application development.

The primary objectives of this project are to:

* Build a responsive Shopify Online Store 2.0 theme using Shopify Liquid.
* Develop a standalone embedded Shopify admin application using React, TypeScript, and Node.js.
* Design a normalized relational database using MySQL and Drizzle ORM.
* Demonstrate clean software architecture through modular components and reusable services.
* Implement business logic that goes beyond basic CRUD by providing intelligent inventory analysis.
* Apply responsive design, accessibility, and maintainable coding practices.
* Produce production-oriented documentation suitable for portfolio presentation and technical review.

---

## 📋 Table of Contents

* [Project Overview](#-project-overview)
* [Project Objectives](#-project-objectives)
* [Features](#-features)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Project Structure](#-project-structure)
* [Prerequisites](#-prerequisites)
* [Installation](#-installation)
* [Environment Variables](#-environment-variables)
* [Running the Project](#-running-the-project)
* [Database Design](#-database-design)
* [Embedded Admin Application](#-embedded-admin-application)
* [Shopify Theme](#-shopify-theme)
* [Testing](#-testing)
* [Performance Considerations](#-performance-considerations)
* [Accessibility](#-accessibility)
* [Future Improvements](#-future-improvements)
* [License](#-license)

# ✨ Features

ShroomHarvest consists of two complementary applications that showcase different aspects of Shopify development: a customer-facing Online Store 2.0 theme and a merchant-focused embedded admin application.

---

# 🛍 Shopify Theme

The storefront is designed for a premium mushroom specialty store, emphasizing a clean user experience, responsive layouts, and educational product discovery.

## Store Pages

### Home

The homepage introduces the ShroomHarvest brand through customizable content sections that highlight featured products, mushroom categories, educational content, and promotional messaging.

### Collection

The collection page provides customers with an organized browsing experience, allowing products to be explored by category while maintaining responsive layouts across desktop and mobile devices.

### Product

The product page presents detailed product information together with optimized imagery, pricing, product descriptions, and purchasing controls.

### Cart

The cart page allows customers to review selected products before checkout while maintaining a consistent shopping experience throughout the storefront.

---

## Custom Theme Sections

The storefront includes multiple reusable Online Store 2.0 sections that can be configured through Shopify's Theme Editor.

Current sections include:

- Hero Banner
- Featured Mushroom Categories
- Mushroom Benefits
- Customer Reviews
- Frequently Asked Questions (FAQ)

Each section is independently configurable using Shopify theme settings, allowing merchants to customize homepage content without modifying code.

---

## Mushroom Finder Quiz

One of the primary interactive features of the storefront is the **Mushroom Finder Quiz**.

The quiz guides customers through a short series of questions based on their intended goals, including:

- Cooking
- Wellness
- Immune Support
- Focus
- Energy
- Home Growing

Based on customer responses, the quiz dynamically recommends relevant mushroom products using lightweight JavaScript while maintaining fast page performance.

---

## Responsive Design

The storefront was developed using a mobile-first approach and is designed to provide a consistent shopping experience across desktop, tablet, and mobile devices.

Key considerations include:

- Responsive layouts
- Flexible typography
- Adaptive navigation
- Optimized images
- Minimal JavaScript
- Semantic HTML

---

# 📊 Smart Inventory Insights

The embedded Shopify application is designed to help merchants make more informed inventory decisions through data-driven insights rather than simple inventory management.

Unlike a traditional CRUD application, Smart Inventory Insights incorporates inventory analytics, supplier management, activity tracking, and intelligent recommendations.

---

## Dashboard

The dashboard provides merchants with a centralized overview of inventory performance.

Key information includes:

- Inventory Health Score
- Low Stock Products
- Fast Selling Products
- Slow Selling Products
- Restock Priorities
- Smart Recommendations
- Recent Activity Timeline

The goal is to surface actionable inventory information immediately after merchants access the application.

---

## Inventory Management

The inventory module enables merchants to maintain inventory records throughout the product lifecycle.

Supported operations include:

- Create inventory records
- Update inventory information
- Archive inventory
- Restore archived inventory
- Adjust stock quantities
- Configure reorder thresholds
- Configure safety stock

---

## Supplier Management

Suppliers are managed independently from inventory records, allowing products to be associated with supplier information.

Supplier information includes:

- Supplier name
- Contact information
- Lead time
- Status
- Associated inventory items

---

## Activity Tracking

Every significant inventory operation automatically generates an activity record to provide a historical audit trail.

Examples include:

- Inventory Created
- Inventory Updated
- Stock Adjusted
- Threshold Updated
- Recommendation Generated
- Inventory Archived

The activity history supports searching and filtering to help merchants review operational changes over time.

---

## Recommendation Engine

The recommendation engine assists merchants by identifying inventory that requires attention before stock issues impact sales.

Recommendations are generated using multiple inventory metrics rather than relying solely on current stock quantity.

Examples include:

- Restock inventory approaching supplier lead time.
- Monitor fast-selling products before expected demand increases.
- Reduce reorder quantities for slow-moving inventory.
- Review products approaching safety stock levels.

This feature demonstrates product thinking by focusing on inventory decision support instead of basic record management.

---

## Inventory Health Score

The Inventory Health Score serves as the core analytical feature of the application.

Rather than evaluating inventory using a fixed stock threshold, the score considers multiple operational factors including:

- Current Inventory
- Sales Velocity
- Estimated Days Remaining
- Supplier Lead Time
- Reorder Threshold
- Safety Stock

This provides merchants with a more meaningful assessment of inventory health that adapts to individual product behavior instead of applying a single rule to all inventory.

# 🛠 Technology Stack

ShroomHarvest combines Shopify's development ecosystem with a modern full-stack technology stack to deliver both a responsive storefront and a merchant-focused embedded application.

---

## Shopify Theme

| Technology | Purpose |
|------------|---------|
| Shopify Liquid | Dynamic storefront templating |
| HTML5 | Semantic page structure |
| CSS3 | Responsive styling and layouts |
| JavaScript (ES6) | Lightweight interactive functionality |
| Shopify Online Store 2.0 | Theme architecture and customizable sections |

---

## Embedded Admin Application

### Frontend

| Technology | Purpose |
|------------|---------|
| React | Component-based user interface |
| TypeScript | Static typing and maintainability |
| Vite | Development server and build tooling |
| Shopify Polaris | Native Shopify admin UI components |
| React Router | Client-side routing |

---

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript runtime |
| Express | REST API framework |
| TypeScript | Backend type safety |
| Shopify App Bridge | Embedded app integration |
| Shopify OAuth | Merchant authentication |

---

### Database

| Technology | Purpose |
|------------|---------|
| MySQL | Relational database |
| Drizzle ORM | Database schema and ORM |
| Drizzle Kit | Database migrations |
| Docker | Containerized MySQL development environment |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| Shopify CLI | Local Shopify development |
| Docker & Docker Compose | Database containerization |
| Cloudflare Tunnel | Secure HTTPS tunnel for Shopify app development |
| npm | Dependency management |
| Git | Version control |

---

# 🏗 System Architecture

The project consists of two independent applications that share the same business concept while serving different user groups.

```text
                    ShroomHarvest
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
  Shopify Theme                 Smart Inventory Insights
(Customer Storefront)            (Embedded Admin App)
        │                                     │
        │                                     ▼
        │                              React + TypeScript
        │                                     │
        │                              Shopify Polaris
        │                                     │
        │                                     ▼
        │                               Express REST API
        │                                     │
        │                                     ▼
        │                              Business Logic Layer
        │                                     │
        │                                     ▼
        │                                Drizzle ORM
        │                                     │
        │                                     ▼
        └──────────────────────────────► MySQL Database
                                         (Docker Container)
```

The Shopify theme focuses on delivering an engaging customer shopping experience, while the embedded application provides merchants with inventory management and decision-support tools.

Although both applications share the same branding and store concept, they operate independently and are documented separately throughout this repository.

---

# 📁 Project Structure

The repository is organized into separate directories for the embedded application and the Shopify theme.

```text
ShroomHarvest/
│
├── app/
│   ├── client/                 # React + Vite frontend
│   │   ├── public/
│   │   ├── src/
│   │   └── package.json
│   │
│   └── server/                 # Express backend
│       ├── db/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── src/
│       └── package.json
│
├── drizzle/                    # Database migrations
│
├── theme/
│   ├── assets/
│   ├── config/
│   ├── layout/
│   ├── locales/
│   ├── sections/
│   ├── snippets/
│   └── templates/
│
├── docker-compose.yml
├── package.json
├── shopify.app.toml
├── README.md
└── APP_DECISIONS.md
```

The repository separates storefront code from the embedded application, making each component easier to maintain and extend independently.

---

# 🗄 Database Overview

The embedded application uses **MySQL** as its relational database together with **Drizzle ORM** for schema management, migrations, and type-safe database access.

The database is designed using a normalized relational model to reduce redundancy while maintaining clear relationships between inventory, suppliers, recommendations, and activity records.

Core entities include:

- Users
- Shops
- Products
- Inventory
- Suppliers
- Inventory History
- Recommendations
- Activity Logs

Relationships are implemented using foreign keys to maintain referential integrity and ensure consistent data throughout the application.

Database schema changes are managed through **Drizzle Kit migrations**, while development data is populated using seed scripts.

# 📦 Prerequisites

Before setting up the project, ensure the following software is installed on your development machine.

| Software | Recommended Version |
|----------|----------------------|
| Node.js | 18.x or later |
| npm | Latest |
| Docker Desktop | Latest |
| Shopify CLI | Latest |
| Git | Latest |

You will also need:

- A Shopify Partner account
- A Shopify development store
- A Cloudflare Tunnel (or Shopify CLI tunnel)
- MySQL running through Docker Compose

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone <repository-url>
cd shroomharvest
```

---

## 2. Install Dependencies

The project uses **npm workspaces** to manage both the client and server applications.

Install all project dependencies from the repository root.

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy the provided environment template.

```bash
cp .env.example app/server/.env
```

Update the environment variables with your own Shopify application credentials before running the application.

---

# 🐳 Database Setup (Docker)

ShroomHarvest uses **Docker Compose** to run a local MySQL database for development.

Start the database:

```bash
npm run docker:up
```

or

```bash
docker compose up -d
```

The Docker environment includes:

| Service | Port |
|----------|------|
| MySQL 8.0 | 3306 |
| Adminer | 8081 |

Adminer provides a lightweight web interface for viewing and managing the development database.

To stop the containers:

```bash
npm run docker:down
```

or

```bash
docker compose down
```

---

# 🗄 Database Migration

Generate database migrations:

```bash
npm run db:generate
```

Apply database migrations:

```bash
npm run db:migrate
```

Populate the database with development seed data:

```bash
npm run db:seed
```

These commands are executed through the server workspace using Drizzle ORM and Drizzle Kit.

---

# ⚙ Environment Variables

The server configuration is managed through an `.env` file.

The primary environment variables include:

| Variable | Description |
|----------|-------------|
| SHOPIFY_API_KEY | Shopify application API key |
| SHOPIFY_API_SECRET | Shopify application secret |
| SHOPIFY_SCOPES | Required Shopify API scopes |
| SHOPIFY_APP_URL | Public application URL |
| DATABASE_URL | MySQL connection string |
| MYSQL_DATABASE | Database name |
| MYSQL_USER | Database user |
| MYSQL_PASSWORD | Database password |
| MYSQL_PORT | MySQL port |
| SESSION_SECRET | Session encryption secret |
| PORT | Express server port |
| NODE_ENV | Application environment |

For the React application, Vite exposes only variables prefixed with `VITE_`.

---

# ▶ Running the Project

Because the project consists of multiple applications, each component can be started independently.

## Start the Backend

```bash
npm run dev:server
```

---

## Start the Frontend

```bash
npm run dev:client
```

---

## Start the Shopify Theme

Use Shopify CLI to serve the Online Store 2.0 theme in your development store.

```bash
shopify theme dev
```

---

# 🌐 Development Workflow

A typical local development workflow is:

1. Start the MySQL Docker container.
2. Run database migrations.
3. Seed the database (if required).
4. Start the backend server.
5. Start the React frontend.
6. Launch the Shopify theme using Shopify CLI.
7. Access the embedded application through your Shopify development store.

This workflow keeps the storefront and embedded application independent while allowing both to be developed within the same repository.

# 🗄 Database Design

The embedded admin application uses **MySQL** as its primary relational database together with **Drizzle ORM** for schema management and type-safe database operations.

The database is designed using a normalized relational model to separate business entities while maintaining data integrity through foreign key relationships.

Drizzle ORM is responsible for:

- Schema definition
- Type-safe database queries
- Migration generation
- Database synchronization
- Seed data execution

Database migrations are version-controlled, allowing schema changes to be tracked consistently throughout development.

---

## Database Design Principles

The schema was designed around the following principles:

- Normalized relational structure
- Foreign key relationships
- Tenant-aware data organization
- Minimal data duplication
- Clear separation of business entities
- Maintainable migration history

These principles make the application easier to extend while maintaining data consistency.

---

## Core Entities

The application stores information across several related entities.

### Shops

Represents Shopify stores that install the embedded application.

Responsibilities include:

- Store identification
- Shop configuration
- Tenant separation

---

### Products

Stores product information used by the inventory system.

Typical information includes:

- Product title
- SKU
- Product status
- Associated supplier
- Related inventory

---

### Inventory

The inventory entity represents the operational state of each tracked product.

Information managed includes:

- Current quantity
- Reorder threshold
- Safety stock
- Supplier reference
- Inventory status

This table serves as the primary data source for inventory analysis and recommendations.

---

### Suppliers

Supplier records maintain purchasing information independently from inventory.

Supplier information includes:

- Supplier name
- Contact details
- Lead time
- Supplier status

Separating suppliers into their own entity reduces duplication and allows multiple products to reference the same supplier.

---

### Inventory History

Inventory History records changes made to inventory quantities over time.

Typical events include:

- Quantity adjustments
- Manual updates
- Stock corrections

Maintaining historical records provides traceability and supports future reporting.

---

### Recommendations

Recommendation records store the output generated by the recommendation engine.

Recommendations help merchants identify inventory requiring attention before stock issues occur.

Examples include:

- Restock recommendations
- Slow-moving inventory
- Fast-selling inventory
- Supplier lead-time alerts

---

### Activity Logs

Activity Logs provide an audit trail for important operations performed within the application.

Examples include:

- Inventory created
- Inventory updated
- Supplier updated
- Recommendation generated
- Inventory archived

This history allows merchants to review operational changes over time.

---

# 🔗 Entity Relationships

The application's entities are connected using relational foreign keys.

```text
Shop
 │
 ├──────────────┐
 │              │
 ▼              ▼
Products     Suppliers
 │              │
 └──────┬───────┘
        │
        ▼
   Inventory
        │
 ┌──────┴─────────┐
 ▼                ▼
Inventory      Recommendations
History
        │
        ▼
 Activity Logs
```

This structure minimizes duplicated data while keeping related business information connected.

---

# 📊 Embedded Admin Application

The embedded application, **Smart Inventory Insights**, is designed to provide merchants with inventory visibility and decision support rather than functioning as a simple inventory management system.

The application combines operational data with business rules to generate actionable recommendations for merchants.

---

## Dashboard

The dashboard acts as the application's central overview page.

It summarizes inventory performance through key metrics and visual indicators, allowing merchants to quickly identify products requiring attention.

Dashboard information includes:

- Inventory Health Score
- Low Stock Products
- Fast Selling Products
- Slow Selling Products
- Restock Priorities
- Smart Recommendations
- Recent Activity

Rather than requiring merchants to inspect every inventory record individually, the dashboard surfaces important operational information immediately after login.

---

## Inventory Management

The inventory module supports the complete inventory lifecycle.

Supported operations include:

- Creating inventory records
- Updating inventory information
- Archiving inventory
- Adjusting stock quantities
- Configuring reorder thresholds
- Managing safety stock

Each inventory operation is recorded within the application's activity tracking system to maintain a historical audit trail.

---

## Supplier Management

Suppliers are managed independently from inventory records.

This separation allows supplier information to remain centralized while being referenced by multiple inventory items.

Supplier management includes:

- Supplier creation
- Supplier updates
- Lead time management
- Contact information
- Supplier status

Lead time information also contributes to inventory recommendations generated by the recommendation engine.

---

## Activity Tracking

Every important operation performed within the application generates an activity record.

This provides merchants with a chronological history of operational events while improving traceability.

Activity records can be searched and filtered to review previous actions and inventory changes.

---

## Recommendation Engine

One of the application's primary product-focused features is its recommendation engine.

Instead of relying solely on stock quantity, recommendations are generated using multiple inventory metrics including:

- Current inventory
- Sales velocity
- Estimated days remaining
- Supplier lead time
- Reorder threshold
- Safety stock

This produces recommendations that better reflect operational conditions than a simple low-stock alert.

---

## Inventory Health Score

The Inventory Health Score serves as the core analytical feature of the application.

Rather than applying a fixed inventory threshold across all products, the score evaluates inventory using multiple operational factors.

This allows merchants to prioritize products based on business impact rather than quantity alone.

The result is a more meaningful representation of inventory health that supports better purchasing decisions.

# 🎨 Shopify Theme

The ShroomHarvest storefront was designed to provide a clean, modern, and educational shopping experience centered around premium mushroom products. The theme follows Shopify Online Store 2.0 principles, allowing merchants to customize content through the Shopify Theme Editor while maintaining a responsive and accessible user interface.

---

## Design Philosophy

The storefront was designed around the following principles:

- Clean and minimal interface
- Nature-inspired visual identity
- Mobile-first responsive layouts
- Educational product discovery
- Easy merchant customization
- Fast page loading
- Accessible navigation

Rather than relying on excessive animations or large JavaScript libraries, the theme emphasizes performance, readability, and ease of maintenance.

---

## Store Pages

### Home Page

The homepage introduces visitors to the ShroomHarvest brand while highlighting featured products, educational content, and promotional sections.

Primary goals include:

- Presenting the brand identity
- Promoting featured collections
- Educating customers about mushroom products
- Encouraging product discovery
- Driving conversions

---

### Collection Page

The collection page provides customers with a structured browsing experience.

Features include:

- Product grid layout
- Product images
- Pricing
- Product information
- Responsive design
- Collection navigation

---

### Product Page

The product page provides detailed product information to support purchasing decisions.

Features include:

- Product images
- Product descriptions
- Pricing
- Product variants (where applicable)
- Quantity selector
- Add-to-cart functionality
- Responsive layout

---

### Cart Page

The cart provides customers with a summary of selected products before checkout.

Features include:

- Cart item management
- Quantity updates
- Cart totals
- Checkout navigation
- Responsive layout

---

# 🧩 Custom Theme Sections

The storefront makes extensive use of reusable Online Store 2.0 sections.

These sections allow merchants to customize content directly from the Shopify Theme Editor without modifying source code.

Implemented sections include:

## Hero Banner

A customizable landing section designed to showcase promotional messaging and featured products.

---

## Featured Mushroom Categories

Highlights major product categories available within the store.

Examples include:

- Fresh Mushrooms
- Dried Mushrooms
- Mushroom Coffee
- Mushroom Tea
- Supplements
- Grow Kits

---

## Mushroom Benefits

Provides educational information about mushroom products and their intended uses.

The goal is to help customers better understand different mushroom varieties before making purchasing decisions.

---

## Customer Reviews

Displays customer testimonials to build trust and improve product credibility.

---

## Frequently Asked Questions

Presents common customer questions using an organized accordion layout to improve usability while reducing information overload.

---

# 🍄 Mushroom Finder Quiz

One of the storefront's primary interactive features is the **Mushroom Finder Quiz**.

The quiz was designed to simplify product discovery by recommending products based on customer goals instead of requiring customers to browse the entire catalog.

Example customer goals include:

- Cooking
- Wellness
- Immune Support
- Focus
- Energy
- Home Growing

Using lightweight JavaScript, the quiz evaluates customer responses and recommends products that best match their selected preferences.

This interactive experience encourages exploration while helping customers identify products more quickly.

---

# 📱 Responsive Design

The storefront follows a mobile-first development approach.

Responsive behavior includes:

- Flexible layouts
- Responsive typography
- Mobile navigation
- Adaptive spacing
- Optimized product grids
- Touch-friendly interactions

Layouts automatically adjust across desktop, tablet, and mobile devices to maintain a consistent shopping experience.

---

# ⚡ Performance Considerations

Several implementation decisions were made to improve storefront performance.

These include:

- Minimal JavaScript
- Lazy loading for non-critical images
- Responsive image sizing
- Semantic HTML structure
- Reusable Liquid sections
- Lightweight client-side interactions

The Mushroom Finder Quiz loads only where required, avoiding unnecessary JavaScript execution across the storefront.

---

# ♿ Accessibility

Accessibility was considered throughout storefront development.

Implemented accessibility practices include:

- Semantic HTML
- Keyboard-accessible navigation
- Accessible buttons
- Image alternative text
- Focus-visible styling
- Responsive layouts
- WCAG-conscious color contrast

Where native HTML elements provide accessible behavior by default, they are preferred over custom JavaScript implementations to reduce complexity while improving usability.

# 🧪 Testing

ShroomHarvest was developed using an incremental testing approach, with both the embedded application and Shopify theme verified throughout development.

## Embedded Application

The Smart Inventory Insights app was tested to ensure core merchant workflows function correctly, including:

- Dashboard metrics and KPI calculations
- Inventory creation, updates, and archival
- Supplier management
- Activity log generation
- Recommendation generation
- Inventory Health Score calculations
- Form validation
- REST API responses
- Database migrations and seed data

Both the client and server were regularly type-checked during development to maintain TypeScript correctness.

### Type Checking

Client

```bash
npm run typecheck --workspace=app/client
```

Server

```bash
npm run typecheck --workspace=app/server
```

---

## Shopify Theme

The storefront was manually tested across all implemented pages to verify responsive layouts, Liquid rendering, and customer interactions.

Verified functionality includes:

- Home page rendering
- Collection browsing
- Product pages
- Shopping cart
- Navigation
- Responsive layouts
- Custom Liquid sections
- Mushroom Finder Quiz
- Product recommendations generated by the quiz

The theme was tested on both desktop and mobile layouts to ensure a consistent shopping experience.

---

## Database Verification

Database functionality was validated by confirming:

- Migration execution
- Seed data generation
- Foreign key relationships
- CRUD operations
- Inventory history tracking
- Recommendation persistence

Database schema changes are managed using Drizzle Kit migrations.

---

# ⚡ Performance Considerations

Performance was considered throughout the project to provide a responsive merchant dashboard and storefront experience.

## Embedded Application

Performance improvements include:

- Modular React component architecture
- Type-safe database access using Drizzle ORM
- Indexed relational database tables
- Efficient REST API endpoints
- Reusable service layer
- Dashboard KPI aggregation
- Lightweight chart rendering using Recharts

Inventory analytics are generated efficiently to minimize unnecessary database queries while providing actionable insights for merchants.

---

## Shopify Theme

The storefront follows Shopify theme best practices by minimizing client-side JavaScript and relying primarily on Liquid for rendering.

Performance considerations include:

- Mobile-first responsive layouts
- Semantic HTML structure
- Lightweight JavaScript
- Responsive images
- Reusable Liquid sections
- Minimal DOM manipulation

These decisions help maintain fast page loads while preserving a polished shopping experience.

---

# ♿ Accessibility

Accessibility was incorporated throughout both the storefront and embedded application.

## Shopify Theme

Implemented accessibility features include:

- Semantic HTML
- Keyboard-accessible navigation
- Accessible forms
- Alternative text for images
- Visible keyboard focus states
- Responsive layouts
- Button-based quiz interactions for keyboard accessibility

Where possible, native HTML elements were used to improve compatibility with assistive technologies.

---

## Embedded Application

The embedded application leverages Shopify Polaris components, which provide accessible user interface patterns for:

- Forms
- Navigation
- Buttons
- Cards
- Tables
- Layouts

Using Polaris helps maintain consistency with Shopify Admin while improving usability and accessibility.

---

# 🚀 Deployment Notes

ShroomHarvest is designed for local Shopify development using Docker and Cloudflare Tunnel.

Development services include:

- Shopify CLI
- Docker Compose
- Cloudflare Tunnel
- Vite Development Server
- Express Backend
- MySQL Database

Before deployment:

- Configure all environment variables.
- Apply database migrations.
- Seed the database if required.
- Update Shopify application URLs for the production environment.
- Ensure the production database is accessible.

---

# 🔮 Future Improvements

Potential future enhancements include:

- Multi-location inventory management
- Real-time inventory synchronization using Shopify Webhooks
- Automated unit and integration testing
- Advanced inventory analytics
- Bulk inventory management tools
- Exportable inventory reports
- Enhanced recommendation algorithms
- Role-based access control
- Inventory forecasting using historical sales trends
- Application monitoring and logging

These improvements would further enhance scalability while preserving the current modular architecture.

# 📄 License

This project was developed as a portfolio and educational project to demonstrate full-stack Shopify application development, including a custom Shopify theme and an embedded Shopify admin application.

It is not intended for commercial distribution without further testing, security review, and production hardening.

---

# 👨‍💻 Author

**Raphael Kurt Magpantay**

Bachelor of Science in Information Technology

This project was designed and developed to demonstrate practical experience in:

- Shopify Theme Development
- Shopify Embedded App Development
- Full-Stack Web Development
- React & TypeScript
- Node.js & Express
- MySQL Database Design
- Drizzle ORM
- UI/UX Design
- REST API Development

---

# 📌 Project Highlights

ShroomHarvest demonstrates both customer-facing and merchant-facing Shopify development within a single repository.

### Customer Experience

- Premium Shopify storefront
- Mobile-first responsive design
- Custom Liquid sections
- Mushroom Finder Quiz
- Educational and product-focused shopping experience

### Merchant Experience

- Embedded Shopify Admin application
- Inventory Health Score
- Smart inventory recommendations
- Supplier management
- Inventory tracking
- Activity history
- Dashboard analytics

Rather than implementing basic CRUD operations alone, the project focuses on solving practical inventory management challenges through data-driven insights and recommendation logic.

---

# 🤝 Acknowledgements

This project was built using the Shopify development ecosystem and several open-source technologies, including:

- Shopify CLI
- Shopify Polaris
- Shopify App Bridge
- React
- Vite
- Express
- Drizzle ORM
- MySQL
- Docker
- Cloudflare Tunnel

Their documentation and tooling made it possible to build a modern Shopify full-stack application.

---

# 💡 Final Notes

ShroomHarvest represents a complete Shopify full-stack project consisting of two independent but complementary applications:

- A customer-facing Shopify storefront built with Liquid.
- A Shopify embedded admin application built with React, TypeScript, Express, and MySQL.

The storefront focuses on delivering a polished shopping experience for mushroom products through responsive design, reusable theme sections, and an interactive Mushroom Finder Quiz.

The embedded application focuses on helping merchants manage inventory more effectively by combining inventory tracking, supplier management, activity logging, dashboard analytics, and an Inventory Health Score that generates actionable recommendations based on sales velocity, stock levels, and supplier lead times.

Together, these components demonstrate modern Shopify development practices while emphasizing software architecture, product thinking, user experience, maintainability, and scalable full-stack application design.