# ---------- BUILD STAGE ----------
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests


# ---------- RUNTIME STAGE ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy only the jar from build stage
COPY --from=builder /app/target/*.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
