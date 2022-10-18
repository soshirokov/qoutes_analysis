# Анализ котировок ценных бумаг

## Чтобы начать

- Установить пакеты:

```
npm install
```

- Указать токен для доступа к Tinkoff Invest API:

  1. Выпустить токен: [Инструкция по выпуску токена](https://tinkoff.github.io/investAPI/token/)
  2. Переименовать файл src/configs/token_sample.json в token.json
  3. Указать в token.json полученный токен

```
{
    "token": "t.##############################################"
}
```

### Запуск локально

```
npm run serve
```

### Сборка проекта

```
npm run build
```
