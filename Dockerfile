FROM golang:1.21-alpine

WORKDIR /app

COPY main.go .

RUN go build -o proxy-server main.go

EXPOSE 8080

CMD ["/app/proxy-server"]
