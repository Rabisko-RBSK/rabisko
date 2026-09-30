FROM mcr.microsoft.com/devcontainers/java:1-21-bullseye

# A imagem base traz um repositório apt legado do Yarn (dl.yarnpkg.com) cuja
# chave GPG expirou/foi removida (NO_PUBKEY 62D54FD4003F6525), o que quebra
# "apt-get update" para QUALQUER feature instalada depois (ex.: docker-outside-
# of-docker). Não usamos o Yarn via apt (Node/npm já vêm pela feature "node"),
# então removemos essa fonte antes das features rodarem.
RUN rm -f /etc/apt/sources.list.d/yarn.list
