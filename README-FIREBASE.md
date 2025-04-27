# Integração do Firebase com Sistema PDV

Este documento explica como configurar e utilizar o Firebase no Sistema PDV.

## Configuração Inicial

### 1. Obter Credenciais do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Na configuração do projeto, obtenha as credenciais da aplicação web e do Admin SDK

### 2. Configurar Credenciais do Admin SDK

1. No console do Firebase, vá para Configurações do Projeto > Contas de Serviço
2. Gere uma nova chave privada
3. Substitua o conteúdo do arquivo `serviceAccountKey.json` na raiz do projeto com a chave gerada

### 3. Instalar Dependências

```bash
npm install
```

## Recursos Disponíveis

### Autenticação

O sistema suporta autenticação tanto pelo banco de dados PostgreSQL quanto pelo Firebase Authentication:

- **Login com PostgreSQL**: Método tradicional usando banco de dados local
- **Login com Firebase**: Utiliza o Firebase Authentication para autenticar usuários

### Registro de Usuários

- É possível registrar novos usuários diretamente pelo Firebase
- Os usuários registrados podem fazer login usando o Firebase Authentication

### APIs Backend

O backend oferece endpoints para:

- `/api/auth/firebase/register`: Registrar usuário no Firebase
- `/api/auth/firebase/verify-token`: Verificar tokens do Firebase e convertê-los para JWT para uso na API

## Uso no Frontend

### Login com Firebase

Para fazer login com Firebase, marque a opção "Usar Firebase" na tela de login.

### Registro de Usuários

1. Clique em "Registrar" na tela de login
2. Preencha os campos solicitados
3. O novo usuário será criado no Firebase Authentication

## Banco de Dados

Os dados podem ser armazenados tanto no PostgreSQL quanto no Firestore:

- **Usuários**: Podem ser armazenados no PostgreSQL ou Firebase Authentication
- **Dados de Negócio**: Podem ser armazenados no PostgreSQL ou Firestore (implementação futura)

## Configuração Avançada

### Variáveis de Ambiente

Para personalizar a configuração, crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Firebase (opcional)
FIREBASE_ENABLED=true

# PostgreSQL (requerido)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senha
DB_NAME=pdv_database

# JWT (requerido)
JWT_SECRET=seu_segredo_jwt
```

## Solução de Problemas

### Firebase Auth não funciona

Verifique:
1. Se o Firebase Authentication está habilitado no Console do Firebase
2. Se o arquivo `serviceAccountKey.json` contém as credenciais corretas
3. Se o método de autenticação por email/senha está habilitado no Firebase

### Erro na conexão com Firestore

Verifique:
1. As regras de segurança do Firestore
2. Se o IP do servidor está na lista de permissões do Firebase
3. Se as credenciais do Admin SDK são válidas

## Segurança

- Nunca compartilhe ou commite o arquivo `serviceAccountKey.json` com as credenciais reais
- Use variáveis de ambiente para configuração em produção
- Configure regras de segurança no Firebase Console para proteger seus dados