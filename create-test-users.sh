#!/bin/bash

# Script para criar utilizadores de teste
# Uso: ./create-test-users.sh

echo "🚀 Criando utilizadores de teste..."

# Função para criar um utilizador
create_user() {
  local name=$1
  local username=$2
  local email=$3
  local password=$4
  local role=$5

  echo ""
  echo "📝 Criando: $username ($role)"
  
  curl -s -X POST http://localhost:3001/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"username\": \"$username\",
      \"email\": \"$email\",
      \"password\": \"$password\"
    }" | jq '.'
}

# Criar admin
create_user "Admin User" "admin" "admin@cromometro.local" "AdminPassword@2026!" "ADMIN"

# Criar utilizador normal
create_user "Regular User" "usuario" "usuario@cromometro.local" "UserPassword@2026!" "USER"

# Criar outro utilizador
create_user "Test User" "teste" "teste@cromometro.local" "TestPassword@2026!" "USER"

echo ""
echo "✅ Utilizadores criados com sucesso!"
echo ""
echo "🔐 Credenciais de teste:"
echo "   Admin:"
echo "      Username: admin"
echo "      Password: AdminPassword@2026!"
echo ""
echo "   Utilizador 1:"
echo "      Username: usuario"
echo "      Password: UserPassword@2026!"
echo ""
echo "   Utilizador 2:"
echo "      Username: teste"
echo "      Password: TestPassword@2026!"
