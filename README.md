<p align="center">
  <img src="./frontend/assets/TA.png" width="100" alt="SEMSTRESS" />
</p>

<h1 align="center">SEMSTRESS</h1>

<p align="center">
  Internship management. Without the stress.
</p>

<p align="center">
  <a href="https://github.com/Samucahub/semstress/stargazers"><img src="https://img.shields.io/github/stars/Samucahub/semstress?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/Samucahub/semstress/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <a href="./README.pt.md"><img src="https://img.shields.io/badge/lang-português-green.svg?style=flat-square" alt="PT" /></a>
</p>

---

## What is this?

A web app for students who need to manage their internships but would rather be doing literally anything else. Track tasks, log hours, generate reports. The usual stuff, but with less clicking and more sanity.

Built because spreadsheets are a crime against humanity.

## Features

**Tasks** - Kanban board with drag-and-drop. Three columns. That's it. That's the feature.

**Time Tracking** - Weekly calendar to log hours. Automatically calculates totals because math is hard at 2am.

**Dashboard** - See your week at a glance. Also your day. Also your active tasks. Basically everything you're procrastinating on.

**Reports** - Generate professional summaries for your supervisor. Makes you look productive even when you spent 3 hours debugging CSS.

**Profile** - Store company info, institute details, mentors, deadlines. The boring but necessary stuff.

**Auth** - JWT-based authentication. Secure enough to keep out your roommate, not the NSA.

## Tech Stack

**Backend**
- NestJS - TypeScript on the server
- Prisma - Database ORM that doesn't make you cry
- PostgreSQL - Because MySQL is for WordPress blogs
- JWT - Stateless auth for stateless developers

**Frontend**
- Next.js 16 with Turbopack - React but faster
- React 19 - The one with all the new hooks
- Tailwind CSS v4 - Utility classes go brrr
- TypeScript - JavaScript with trust issues

## Installation

You'll need Node.js 18+, PostgreSQL 14+, and approximately 10 minutes of your life.

```bash
# Clone it
git clone https://github.com/Samucahub/semstress.git
cd semstress

# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Environment Variables

Create `.env` in the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/semstress"
JWT_SECRET="change-this-or-suffer-the-consequences"
PORT=3001
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Setup

```bash
npx prisma migrate dev
```

## Running

```bash
# Backend (port 3001)
npm run start:dev

# Frontend (port 3000) - different terminal
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If it doesn't work, have you tried turning it off and on again?

## Project Structure

```
semstress/
├── src/                 # NestJS backend
│   ├── auth/           # Login/Register stuff
│   ├── tasks/          # Task CRUD
│   ├── time-entries/   # Hour logging
│   ├── reports/        # Report generation
│   └── internship/     # Profile management
├── frontend/
│   ├── app/            # Next.js pages
│   ├── components/     # React components
│   └── lib/            # Utils and types
└── prisma/
    └── schema.prisma   # Database schema
```

## API Endpoints

**Auth**
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token

**Tasks**
- `GET /tasks` - List all tasks
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (goodbye forever)

**Time Entries**
- `GET /time-entries?from=DATE&to=DATE` - List entries
- `POST /time-entries` - Log hours

**Reports**
- `GET /reports/summary` - Weekly/daily summary
- `GET /reports/detailed` - Full report

**Profile**
- `GET /internship/my` - Get your internship data
- `POST /internship` - Update internship data

## Contributing

Found a bug? Have a feature idea? PRs welcome. Please follow the usual GitHub flow:

1. Fork
2. Branch
3. Code
4. Test (or don't, I'm not your supervisor)
5. PR

## License

MIT - Do whatever you want. Just don't sue me if your server catches fire.

## Author

**samudevx**

- GitHub: [@Samucahub](https://github.com/Samucahub)
- LinkedIn: [@samudevx](https://linkedin.com/in/samudevx)
- Twitter: [@samudevx](https://twitter.com/samudevx)

## Acknowledgments

Built with NestJS, Next.js, and an unhealthy amount of caffeine.

Special thanks to Stack Overflow for basically writing half of this.

---

<p align="center">
  Made by <a href="https://github.com/Samucahub">samudevx</a> because internship paperwork is the worst.
</p>

# (Opcional) Seed da base de dados
npx prisma db seed
```

## 🏃 Como Executar

### Desenvolvimento

```bash
# Terminal 1 - Backend (porta 3001)
npm run start:dev

# Terminal 2 - Frontend (porta 3000)
cd frontend
npm run dev
```

Aceda à aplicação em [http://localhost:3000](http://localhost:3000)

### Produção

```bash
# Build do backend
npm run build
npm run start:prod

# Build do frontend
cd frontend
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
semstress/
├── src/                      # Backend NestJS
│   ├── auth/                 # Módulo de autenticação
│   ├── tasks/                # Gestão de tarefas
│   ├── time-entries/         # Registo de horas
│   ├── reports/              # Geração de relatórios
│   ├── users/                # Gestão de utilizadores
│   ├── internship/           # Perfil de estágio
│   └── common/               # Guards, decorators, Prisma
├── frontend/
│   ├── app/                  # Next.js App Router
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── tasks/            # Vista Kanban
│   │   ├── time-entries/     # Calendário semanal
│   │   ├── reports/          # Relatórios
│   │   ├── profile/          # Perfil de estágio
│   │   ├── login/            # Autenticação
│   │   └── register/         # Registo
│   ├── components/           # Componentes reutilizáveis
│   └── lib/                  # Utils e tipos
└── prisma/
    └── schema.prisma         # Schema da base de dados
```

## 🔌 API Endpoints

### Autenticação
- `POST /auth/register` - Criar nova conta
- `POST /auth/login` - Login (retorna JWT token)

### Tarefas
- `GET /tasks` - Listar tarefas
- `POST /tasks` - Criar tarefa
- `PATCH /tasks/:id` - Atualizar tarefa
- `DELETE /tasks/:id` - Eliminar tarefa

### Registo de Horas
- `GET /time-entries?from=YYYY-MM-DD&to=YYYY-MM-DD` - Listar registos
- `POST /time-entries` - Criar registo

### Relatórios
- `GET /reports/summary` - Resumo semanal/diário
- `GET /reports/detailed` - Relatório detalhado

### Perfil
- `GET /internship/my` - Obter perfil de estágio
- `POST /internship` - Criar/atualizar perfil

## 🎨 Screenshots

_Em breve - adicionar screenshots da aplicação_

## 🤝 Contribuições

Contribuições são muito bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para a sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit as suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o ficheiro [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**samudevx**

- GitHub: [@Samucahub](https://github.com/Samucahub)
- LinkedIn: [@samudevx](https://linkedin.com/in/samudevx)
- Twitter: [@samudevx](https://twitter.com/samudevx)

## 🙏 Agradecimentos

- [NestJS](https://nestjs.com/) - Framework backend incrível
- [Next.js](https://nextjs.org/) - React framework poderoso
- [Prisma](https://www.prisma.io/) - ORM moderno e type-safe
- Comunidade open source 💙

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/Samucahub">samudevx</a>
</p>
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
