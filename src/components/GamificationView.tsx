import { Trophy, Medal, Star, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function GamificationView() {
  return (
    <div className="space-y-6 px-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-600" />
          Gamificación
        </h1>
        <p className="text-gray-600 mt-2">
          Sistema de puntuación y métricas para motivar la revisión de PRs
        </p>
      </div>

      {/* Sección de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRs Revisadas</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">+20% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">-15% mejora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,450</div>
            <p className="text-xs text-muted-foreground">Top 3 del equipo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 días</div>
            <p className="text-xs text-muted-foreground">Récord: 14 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking del equipo */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking del Equipo</CardTitle>
          <CardDescription>
            Clasificación basada en PRs revisadas y tiempo de respuesta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
              <div className="flex items-center gap-3">
                <Medal className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold">Usuario 1</p>
                  <p className="text-sm text-muted-foreground">4,120 puntos</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">#1</span>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Medal className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="font-semibold">Usuario 2</p>
                  <p className="text-sm text-muted-foreground">3,890 puntos</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-600">#2</span>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
              <div className="flex items-center gap-3">
                <Medal className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold">Usuario 3</p>
                  <p className="text-sm text-muted-foreground">3,450 puntos</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">#3</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sistema de puntuación */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Puntuación</CardTitle>
          <CardDescription>
            Cómo se calculan los puntos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border-l-4 border-green-500 bg-green-50">
              <span className="font-medium">Revisión de PR normal</span>
              <span className="font-bold text-green-700">+10 puntos</span>
            </div>
            <div className="flex justify-between items-center p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <span className="font-medium">Revisión de PR rápida (⚡)</span>
              <span className="font-bold text-yellow-700">+15 puntos</span>
            </div>
            <div className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50">
              <span className="font-medium">Revisión de PR urgente (🔥)</span>
              <span className="font-bold text-red-700">+25 puntos</span>
            </div>
            <div className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-blue-50">
              <span className="font-medium">Revisión en menos de 1 hora</span>
              <span className="font-bold text-blue-700">+5 puntos bonus</span>
            </div>
            <div className="flex justify-between items-center p-3 border-l-4 border-purple-500 bg-purple-50">
              <span className="font-medium">Racha de 7 días consecutivos</span>
              <span className="font-bold text-purple-700">+50 puntos bonus</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
