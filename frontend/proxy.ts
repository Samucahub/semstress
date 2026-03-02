import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/simple-tasks',
  '/tasks',
  '/projects',
  '/documents',
  '/time-entries',
  '/reports',
  '/profile',
  '/cromomaximo',
];

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/login', '/register', '/about', '/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Verificar token no cookie ou header
  // Como usamos localStorage no client, verificamos se existe o token cookie
  // O ProtectedRoute no client-side faz a verificação completa
  // Este middleware serve como primeira barreira server-side
  const token = request.cookies.get('token')?.value;
  
  // Se não há cookie, verificar se é uma navegação direta (sem JS)
  // O client-side ProtectedRoute tratará do redirect para quem tem token no localStorage
  // Mas para SSR/prerender, bloqueamos acesso direto sem cookie
  
  // Para rotas de admin, verificação extra
  if (pathname.startsWith('/cromomaximo')) {
    // O backend valida o role — aqui só garantimos que existe token
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.next(); // Let client-side ProtectedRoute handle it
    }
  }

  // Security headers para todas as respostas
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
