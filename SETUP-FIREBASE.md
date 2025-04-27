# Configuração do Firebase no Sistema PDV

Este documento explica como configurar o Firebase no sistema PDV usando as credenciais fornecidas.

## Pré-requisitos

1. Node.js e npm instalados
2. Conta no Firebase (já configurada com o projeto pdv1-49dc8)

## Instalação de Dependências

Para instalar as dependências do Firebase, execute:

```bash
# Instalar dependências do Firebase
npm install firebase@10.9.0 firebase-admin@11.10.1
```

Ou use o arquivo package.firebase.json:

```bash
npm install --package-lock-only package.firebase.json
npm ci
```

## Configuração do Firebase Admin SDK

As credenciais do Firebase Admin SDK já estão configuradas no arquivo `serviceAccountKey.json`. Este arquivo é usado pelo backend para operações administrativas como verificação de tokens e gerenciamento de usuários.

Se você precisar atualizar essas credenciais:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione o projeto pdv1-49dc8
3. Vá para Configurações do Projeto > Contas de serviço
4. Clique em "Gerar nova chave privada"
5. Substitua o conteúdo do arquivo `serviceAccountKey.json` pelo conteúdo do arquivo baixado

## Configuração do Firebase Web SDK

As configurações do Firebase Web SDK já estão integradas ao sistema. A configuração está sendo usada em:

1. `/public/js/core/firebase-config.js` - Arquivo central de configuração
2. `/public/pages/login.html` - Página de login com autenticação Firebase

A configuração atual é:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAnU9Yo3R3G17f8uXWExczIcJ83PsR0ckw",
  authDomain: "pdv1-49dc8.firebaseapp.com",
  projectId: "pdv1-49dc8",
  storageBucket: "pdv1-49dc8.firebasestorage.app",
  messagingSenderId: "765042226958",
  appId: "1:765042226958:web:211035b74ce82e54ba895f",
  measurementId: "G-CX58J861VR"
};
```

## Importar Scripts do Firebase de CDN

Se preferir usar a versão CDN do Firebase (sem npm), você pode modificar as importações nos arquivos `firebase-config.js` e `login.html`:

```javascript
// Versão CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
```

## Verificação da Configuração

Para verificar se a configuração do Firebase está funcionando corretamente:

1. Inicie o servidor: `npm start`
2. Acesse a página de login
3. Tente se registrar utilizando o Firebase
4. Acesse a página Admin Firebase em `/pages/admin-firebase.html` para verificar o status da conexão

## Solução de Problemas

1. **Erro de módulo não encontrado**: Verifique se as dependências do Firebase foram instaladas corretamente
2. **Erro de autenticação**: Verifique se as regras de autenticação estão configuradas no Console do Firebase
3. **Erro de acesso ao Firestore**: Verifique se as regras do Firestore permitem leitura/escrita

Para mais informações, consulte:
- [Documentação do Firebase](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)