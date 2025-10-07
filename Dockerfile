FROM golang:1.21-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos
COPY main.go .

# Compilar
RUN go build -o proxy-server main.go

# Expor portas
EXPOSE 8080 8081

# Rodar servidor
CMD ["./proxy-server"]
