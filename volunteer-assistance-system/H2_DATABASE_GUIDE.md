# H2 Database Configuration Guide

## Overview
The application is now configured to use **H2 in-memory database** instead of MongoDB. This allows you to run and test the application without installing MongoDB.

## Current Configuration

### Database Settings
- **Database Type**: H2 (in-memory)
- **Database Name**: `volunteer_db`
- **JDBC URL**: `jdbc:h2:mem:volunteer_db`
- **Username**: `sa`
- **Password**: _(empty)_
- **H2 Console**: Enabled at `/h2-console`

### JPA/Hibernate Settings
- **Dialect**: H2Dialect
- **DDL Auto**: `update` (automatically creates/updates tables)
- **Show SQL**: `true` (logs SQL queries to console)
- **Format SQL**: `true` (formats SQL for readability)

## How to Run

1. **Navigate to project directory:**
   ```bash
   cd d:\project\volunteer-assistance-system
   ```

2. **Build the project:**
   ```bash
   mvn clean install
   ```

3. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

4. **Application starts on:** `http://localhost:8080`

## Accessing H2 Console

The H2 console provides a web-based interface to view and query your database.

1. **Open browser and navigate to:**
   ```
   http://localhost:8080/h2-console
   ```

2. **Login credentials:**
   - **JDBC URL**: `jdbc:h2:mem:volunteer_db`
   - **User Name**: `sa`
   - **Password**: _(leave empty)_

3. **Click "Connect"**

4. **You can now:**
   - View all tables
   - Run SQL queries
   - Inspect data
   - Monitor database structure

## Database Tables

The application will automatically create the following tables:

### Main Tables
- **volunteers** - Stores volunteer information
- **assistance_requests** - Stores assistance requests

### Collection Tables (for Lists)
- **volunteer_available_days** - Stores volunteer available days
- **volunteer_service_types** - Stores volunteer service types

## Key Changes from MongoDB

| Aspect | MongoDB | H2 (JPA) |
|--------|---------|----------|
| ID Type | `String` | `Long` (auto-generated) |
| Annotations | `@Document`, `@Id` | `@Entity`, `@Table`, `@Id`, `@GeneratedValue` |
| Repository | `MongoRepository` | `JpaRepository` |
| Lists | Direct storage | `@ElementCollection` with separate tables |
| Enums | Direct storage | `@Enumerated(EnumType.STRING)` |

## API Changes

### ID Format in URLs
All IDs are now **Long** (numeric) instead of String:

**Before (MongoDB):**
```
GET /api/volunteers/65abc123def456789
```

**Now (H2):**
```
GET /api/volunteers/1
```

### Sample API Calls

**Create Volunteer:**
```bash
curl -X POST http://localhost:8080/api/volunteers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "location": "New York",
    "availableDays": ["Monday", "Wednesday"],
    "serviceType": ["Food Delivery"],
    "rating": 4.5,
    "active": true
  }'
```

**Get Volunteer by ID:**
```bash
curl http://localhost:8080/api/volunteers/1
```

**Create Assistance Request:**
```bash
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterName": "Jane Smith",
    "requesterContact": "5551234567",
    "location": "New York",
    "serviceType": "Food Delivery",
    "description": "Need food delivery",
    "urgencyLevel": "HIGH"
  }'
```

## Data Persistence

> **Important**: H2 is configured as an **in-memory database**. This means:
> - Data is stored in RAM
> - All data is **lost when the application stops**
> - Perfect for development and testing
> - Not suitable for production

### To Use File-Based H2 (Data Persists)

If you want data to persist between restarts, change the datasource URL in `application.properties`:

```properties
# Change from:
spring.datasource.url=jdbc:h2:mem:volunteer_db

# To:
spring.datasource.url=jdbc:h2:file:./data/volunteer_db
```

This will create a file-based database in the `data` folder.

## Switching Back to MongoDB

To switch back to MongoDB in the future:

1. **Update `pom.xml`:**
   - Replace `spring-boot-starter-data-jpa` with `spring-boot-starter-data-mongodb`

2. **Update `application.properties`:**
   - Comment out H2 configuration
   - Uncomment MongoDB configuration

3. **Update Entity Classes:**
   - Change `@Entity` to `@Document`
   - Change `@GeneratedValue` to MongoDB ID generation
   - Change ID type from `Long` to `String`

4. **Update Repositories:**
   - Change `JpaRepository` to `MongoRepository`

## Troubleshooting

### Application won't start
- Check if port 8080 is already in use
- Verify Java 17 is installed: `java -version`
- Ensure Maven is installed: `mvn -version`

### Can't access H2 console
- Verify application is running
- Check that `spring.h2.console.enabled=true` in application.properties
- Use correct JDBC URL: `jdbc:h2:mem:volunteer_db`

### Tables not created
- Check console logs for errors
- Verify `spring.jpa.hibernate.ddl-auto=update` is set
- Ensure entity classes have proper JPA annotations

## Benefits of H2 for Development

✅ **No installation required** - H2 is embedded in the application
✅ **Fast startup** - In-memory database is very fast
✅ **Easy testing** - Fresh database on every restart
✅ **Web console** - Easy to inspect data
✅ **SQL compatible** - Standard SQL queries work
✅ **Zero configuration** - Works out of the box

## Next Steps

1. Start the application with `mvn spring-boot:run`
2. Test the APIs using curl or Postman
3. View data in H2 console at `http://localhost:8080/h2-console`
4. Check the AI matching algorithm by creating volunteers and requests
