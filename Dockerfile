# syntax=docker/dockerfile:1

# --- Stage 1: build ---
FROM maven:3.10.0-eclipse-temurin-25 AS build
WORKDIR /app

# Cache de dependências: copia só o pom.xml primeiro
COPY backend/pom.xml .
RUN mvn -B dependency:go-offline

# Copia o restante do código-fonte e builda o jar
COPY backend/src ./src
RUN mvn -B clean package -DskipTests

# --- Stage 2: runtime ---
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

RUN useradd --create-home --shell /bin/bash rabisko
USER rabisko

COPY --from=build --chown=rabisko:rabisko /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
