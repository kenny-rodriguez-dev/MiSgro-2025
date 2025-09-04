"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../services/api";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { useTheme } from "../../theme-provider";

/* ChartJS */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalysisPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();
  const { darkMode } = useTheme(); // Hook para el modo oscuro

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (!loadingAuth) {
      if (!user || user.role !== "Supervisor") {
        router.push("/");
        return;
      }
      fetchAnalysisData();
    }
  }, [loadingAuth, user, router]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    try {
      const ordersRes = await API.get("/orders");
      const orders = ordersRes.data;
      const notCanceled = orders.filter((o) => o.status !== "Cancelado");
      setTotalOrders(orders.length);

      let sum = 0;
      for (const o of notCanceled) {
        sum += o.totalAmount;
      }
      setRevenue(sum);

      // Ahora el Supervisor puede ver los usuarios (requiere cambio en backend)
      const usersRes = await API.get("/users");
      const userOnly = usersRes.data.filter((u) => u.role === "User");
      setTotalUsers(userOnly.length);

      const productsRes = await API.get("/products");
      setTopProducts(productsRes.data.slice(0, 3));

      const chartOrders = notCanceled;
      const labels = chartOrders.map((o) => `Order#${o.id}`);
      const dataVals = chartOrders.map((o) => o.totalAmount);

      setChartData({
        labels,
        datasets: [
          {
            label: "Monto del Pedido (no cancelados)",
            data: dataVals,
            borderColor: "rgba(75,192,192,1)",
            fill: false,
          },
        ],
      });
    } catch (error) {
      console.error("Error en analysis:", error);
    }
    setLoading(false);
  };
  
  // Opciones para hacer el gráfico responsivo y controlar su tamaño
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? 'white' : '#666', // Color de la leyenda del gráfico
        },
      },
    },
    scales: {
      x: {
        ticks: { color: darkMode ? 'white' : '#666' },
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
      },
      y: {
        ticks: { color: darkMode ? 'white' : '#666' },
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
      },
    },
  };

  if (loadingAuth) {
    return <p className="mt-4 text-center">Cargando autenticación...</p>;
  }

  if (!user || user.role !== "Supervisor") {
    return <p className="text-center mt-4">No tienes permisos de Supervisor para ver esta página.</p>;
  }

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Breadcrumbs aria-label="breadcrumb" className="mb-4" sx={{ color: darkMode ? 'white' : 'inherit' }}>
        <MUILink component={NextLink} href="/" underline="hover" color="inherit">
          Inicio
        </MUILink>
        <Typography color="inherit" fontWeight="bold">
          Análisis
        </Typography>
      </Breadcrumbs>

      <Card className={`shadow-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'}`}>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <Typography variant="h6" fontWeight="bold">
              Análisis y Métricas
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleBack}>
              Volver
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center my-4">
              <CircularProgress />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tarjeta de Usuarios */}
              <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-purple-50'}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Usuarios (role=User)
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {totalUsers}
                </Typography>
              </div>

              {/* Tarjeta de Pedidos Totales */}
              <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-green-50'}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Pedidos Totales
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {totalOrders}
                </Typography>
                <Typography variant="caption" className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Incluye cancelados
                </Typography>
              </div>

              {/* Tarjeta de Ingresos */}
              <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-blue-50'}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Ingresos Totales (sin cancelados)
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  ${revenue.toFixed(2)}
                </Typography>
              </div>

              {/* Tarjeta de Top Productos */}
              <div className={`p-4 rounded shadow-sm ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-yellow-50'}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Top 3 Productos (demo)
                </Typography>
                {topProducts.length === 0 ? (
                  <Typography variant="body2" className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No hay productos
                  </Typography>
                ) : (
                  <ul className="list-disc ml-5 text-sm">
                    {topProducts.map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Tarjeta del Gráfico */}
              <div className={`md:col-span-2 p-4 rounded shadow-sm ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Ventas por Pedido (excluye cancelados)
                </Typography>
                {chartData.labels && chartData.labels.length > 0 ? (
                  <div className="relative h-64 md:h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <Typography variant="body2" className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No hay datos de ventas para mostrar en el gráfico.
                  </Typography>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
