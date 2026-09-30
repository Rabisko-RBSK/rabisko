#!/usr/bin/env bash
# Builda e roda o backend via jar empacotado (java -jar), em vez de
# `mvnw spring-boot:run`.
#
# Por quê: `mvnw spring-boot:run` monta um classpath "achatado" com TODAS as
# variantes de plataforma dos binários nativos do JavaCPP/BoofCV (OpenCV,
# FFmpeg — linux-x86_64, windows-x86_64 e macosx-x86_64 simultaneamente,
# já que o pom.xml não restringe via javacpp.platform). Isso trava a JVM
# com SIGSEGV (exit code 139) ao inicializar, de forma consistente dentro
# do Dev Container. Rodando o jar empacotado (que usa o classloader aninhado
# do Spring Boot em vez de um -cp flat) o boot funciona normalmente.
#
# Custo: sem hot-reload do DevTools — rode este script de novo a cada
# mudança de código.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "==> Compilando..."
./mvnw -q clean package -DskipTests

echo "==> Iniciando (profile local)..."
exec java -jar target/*.jar --spring.profiles.active=local
