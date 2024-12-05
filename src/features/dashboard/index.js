import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useDispatch } from "react-redux";
import { showNotification } from "../common/headerSlice";

// Componentes
import DashboardStats from "./components/DashboardStats";
import DoughnutChart from "./components/DoughnutChart";
import Modal from "./components/Modal";
import DataTable from "./components/DataTable";

// Íconos
import UserGroupIcon from "@heroicons/react/24/outline/UserGroupIcon";
import UsersIcon from "@heroicons/react/24/outline/UsersIcon";
import CircleStackIcon from "@heroicons/react/24/outline/CircleStackIcon";
import CreditCardIcon from "@heroicons/react/24/outline/CreditCardIcon";

// Mapeos
import polMapping from "../../data/pol.json";
import poeMapping from "../../data/poe.json";
import statusMapping from "../../data/status.json";
import ejecutivoMapping from "../../data/ejecutivo.json";
import cantEquipoMapping from "../../data/cantEquipo.json";
import tamanoEquipoMapping from "../../data/tamanoEquipo.json";

const getPolName = (pol) => polMapping[pol] || "";
const getPoeName = (poe) => poeMapping[poe] || "";
const getStatusName = (status) => statusMapping[status] || "";
const getEjecutivoName = (ejecutivo) => ejecutivoMapping[ejecutivo] || "";
const getCantEquipoName = (cantEquipo) => cantEquipoMapping[cantEquipo] || "";
const getTamanoEquipoName = (tamanoEquipo) =>
  tamanoEquipoMapping[tamanoEquipo] || "";

function Dashboard() {
  const dispatch = useDispatch();
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState({
    executive: {},
    client: {},
    status: {},
    pol: {},
    poe: {},
  });
  const [todayStats, setTodayStats] = useState(0);
  const [weekStats, setWeekStats] = useState(0);
  const [monthStats, setMonthStats] = useState(0);
  const [totalStats, setTotalStats] = useState(0);

  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [tableTitle, setTableTitle] = useState("");
  const [modalData, setModalData] = useState([]);

  const [categoryStats, setCategoryStats] = useState({
    origen: 0,
    ptoEntrada: 0,
    pendienteDescarga: 0,
    hubPanama: 0,
    cfsPanama: 0,
    movimientoPanamaCrc: 0,
    almacenDestino: 0,
    archivar: 0,
    enTransito: {
      sevenDays: 0,
      fifteenDays: 0,
      total: 0,
    },
  });

  const preestadoCategories = {
    origen: [100000000, 100000001, 100000015, 100000014, 100000017],
    enTransito: {
      total: [100000002],
      sevenDays: [100000002, 100000003],
      fifteenDays: [100000002, 100000003],
    },
    ptoEntrada: [100000003],
    pendienteDescarga: [100000018],
    hubPanama: [100000026],
    cfsPanama: [100000025],
    movimientoPanamaCrc: [100000024],
    almacenDestino: [100000004],
    archivar: [100000009, 100000013],
  };

  const handleCategoryClick = (category, period = null) => {
    let filtered = [];
    let title = "";

    switch (category) {
      case "origen":
        filtered = filteredData.filter((item) =>
          preestadoCategories.origen.includes(item.new_preestado2)
        );
        title = "Cargas en Origen";
        break;
      case "ptoEntrada":
        filtered = filteredData.filter((item) =>
          preestadoCategories.ptoEntrada.includes(item.new_preestado2)
        );
        title = "Cargas en Pto Entrada";
        break;
      case "pendienteDescarga":
        filtered = filteredData.filter((item) =>
          preestadoCategories.pendienteDescarga.includes(item.new_preestado2)
        );
        title = "Cargas en Bodega Pendiente de Descarga";
        break;
      case "hubPanama":
        filtered = filteredData.filter((item) =>
          preestadoCategories.hubPanama.includes(item.new_preestado2)
        );
        title = "Cargas en Bodega HUB Panamá";
        break;
      case "cfsPanama":
        filtered = filteredData.filter((item) =>
          preestadoCategories.cfsPanama.includes(item.new_preestado2)
        );
        title = "Cargas en CFS Panamá (Inventario LATAM)";
        break;
      case "movimientoPanamaCrc":
        filtered = filteredData.filter((item) =>
          preestadoCategories.movimientoPanamaCrc.includes(item.new_preestado2)
        );
        title = "Cargas en Movimiento de Panamá a Costa Rica (CRC)";
        break;
      case "almacenDestino":
        filtered = filteredData.filter((item) =>
          preestadoCategories.almacenDestino.includes(item.new_preestado2)
        );
        title = "Cargas en Almacén Destino";
        break;
      case "archivar":
        filtered = filteredData.filter((item) =>
          preestadoCategories.archivar.includes(item.new_preestado2)
        );
        title = "Cargas Pendientes de Archivar";
        break;
      case "enTransito":
        const today = moment().startOf("day");
        const sevenDaysFromToday = moment().add(7, "days").endOf("day");
        const fifteenDaysFromToday = moment().add(15, "days").endOf("day");

        // Filtrar datos basados en el periodo
        if (period === "sevenDays") {
          filtered = filteredData.filter(
            (item) =>
              preestadoCategories.enTransito.sevenDays.includes(
                item.new_preestado2
              ) &&
              item.new_eta && // Verifica que `new_eta` no sea null
              moment(item.new_eta).isBetween(
                today,
                sevenDaysFromToday,
                null,
                "[]"
              )
          );
          title = "Cargas en Tránsito (Próximos 7 Días)";
        } else if (period === "fifteenDays") {
          filtered = filteredData.filter(
            (item) =>
              preestadoCategories.enTransito.fifteenDays.includes(
                item.new_preestado2
              ) &&
              item.new_eta && // Verifica que `new_eta` no sea null
              moment(item.new_eta).isBetween(
                today,
                fifteenDaysFromToday,
                null,
                "[]"
              )
          );
          title = "Cargas en Tránsito (Próximos 15 Días)";
        } else {
          filtered = filteredData.filter((item) =>
            preestadoCategories.enTransito.total.includes(item.new_preestado2)
          );
          title = "Cargas en Tránsito (Total)";
        }
        break;
      default:
        return;
    }

    // Formatear los datos para la tabla
    const formattedData = filtered.map((item) => ({
      idtra: item.title || "Sin IDTRA", // ID único
      nombreCliente: item._customerid_value || "Desconocido",
      status: getStatusName(item.new_preestado2) || "Desconocido",
      cantidadEquipo: getCantEquipoName(item.new_cantequipo) || "Desconocido",
      tamanoEquipo: getTamanoEquipoName(item.new_tamaoequipo) || "Desconocido",
      bultos: item.new_contidadbultos || "Desconocido",
      peso: item.new_peso || "Desconocido",
      po: item.new_po || "Desconocido",
      pol: getPolName(item.new_pol) || "Desconocido",
    }));

    setModalData(formattedData);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Realizar la solicitud a la API
        const response = await axios.get(
          "https://api.logisticacastrofallas.com/api/Panama?numFilter=0&type=0"
        );
        const data = response.data.data.value;

        // Normalizar los datos y filtrar datos válidos
        const validData = data.map((item) => ({
          ...item,
          new_preestado2: Number(item.new_preestado2), // Convertir a número si es necesario
        }));

        setFilteredData(validData);

        const today = moment().startOf("day");

        // Estadísticas por categoría
        const categoryStats = {
          origen: validData.filter((item) =>
            preestadoCategories.origen.includes(item.new_preestado2)
          ).length,
          ptoEntrada: validData.filter((item) =>
            preestadoCategories.ptoEntrada.includes(item.new_preestado2)
          ).length,
          pendienteDescarga: validData.filter((item) =>
            preestadoCategories.pendienteDescarga.includes(item.new_preestado2)
          ).length,
          hubPanama: validData.filter((item) =>
            preestadoCategories.hubPanama.includes(item.new_preestado2)
          ).length,
          cfsPanama: validData.filter((item) =>
            preestadoCategories.cfsPanama.includes(item.new_preestado2)
          ).length,
          movimientoPanamaCrc: validData.filter((item) =>
            preestadoCategories.movimientoPanamaCrc.includes(
              item.new_preestado2
            )
          ).length,
          almacenDestino: validData.filter((item) =>
            preestadoCategories.almacenDestino.includes(item.new_preestado2)
          ).length,
          archivar: validData.filter((item) =>
            preestadoCategories.archivar.includes(item.new_preestado2)
          ).length,
          enTransito: {
            sevenDays: validData.filter(
              (item) =>
                preestadoCategories.enTransito.sevenDays.includes(
                  item.new_preestado2
                ) &&
                item.new_eta && // Verificar que new_eta no sea null
                moment(item.new_eta).isBetween(
                  today,
                  moment().add(7, "days"),
                  null,
                  "[]"
                )
            ).length,
            fifteenDays: validData.filter(
              (item) =>
                preestadoCategories.enTransito.fifteenDays.includes(
                  item.new_preestado2
                ) &&
                item.new_eta && // Verificar que new_eta no sea null
                moment(item.new_eta).isBetween(
                  today,
                  moment().add(15, "days"),
                  null,
                  "[]"
                )
            ).length,
            total: validData.filter((item) =>
              preestadoCategories.enTransito.total.includes(item.new_preestado2)
            ).length,
          },
        };

        setCategoryStats(categoryStats);

        // Agrupación de datos
        const groupBy = (arr, key) =>
          arr.reduce((acc, item) => {
            const groupValue = item[key];
            if (groupValue !== undefined) {
              acc[groupValue] = (acc[groupValue] || 0) + 1;
            }
            return acc;
          }, {});

        setChartData({
          executive: groupBy(validData, "new_ejecutivocomercial"),
          client: groupBy(validData, "_customerid_value"),
        });
      } catch (error) {
        dispatch(
          showNotification({ message: "Error fetching data", type: "error" })
        );
      }
    };

    fetchData();
  }, [dispatch]);

  // Manejar clic en las ruletas
  const handleCircleClick = (type, data) => {
    let filtered;
    if (type === "executive") {
      filtered = filteredData.filter(
        (item) => getEjecutivoName(item.new_ejecutivocomercial) === data.label
      );
      setTableTitle(`Trámites para Ejecutivo: ${data.label}`);
    } else if (type === "client") {
      filtered = filteredData.filter(
        (item) => item._customerid_value === data.label
      );
      setTableTitle(`Trámites para Cliente: ${data.label}`);
    }

    // Verifica que filtered tenga datos
    if (!filtered || filtered.length === 0) {
      setModalData([]);
      return;
    }

    // Formatear los datos para la tabla
    const formattedData = filtered.map((item) => ({
      idtra: item.title || "Sin IDTRA", // ID único
      nombreCliente: item._customerid_value || "Desconocido",
      status: getStatusName(item.new_preestado2) || "Desconocido",
      cantidadEquipo: getCantEquipoName(item.new_cantequipo) || "Desconocido",
      tamanoEquipo: getTamanoEquipoName(item.new_tamaoequipo) || "Desconocido",
      bultos: item.new_contidadbultos || "Desconocido",
      peso: item.new_peso || "Desconocido",
      po: item.new_po || "Desconocido",
      pol: getPolName(item.new_pol) || "Desconocido",
    }));

    console.log(formattedData);
    setModalData(formattedData);

    // Abrir el modal con los datos filtrados
    setModalData(formattedData);
    setModalTitle(
      `Detalles para ${type === "executive" ? "Ejecutivo" : "Cliente"}: ${
        data.label
      }`
    );
    setIsModalOpen(true);
  };

  // Cerrar modal si se hace clic fuera de él
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Estadísticas de Cargas en Tránsito */}
      <div className="grid lg:grid-cols-3 mt-2 md:grid-cols-2 grid-cols-1 gap-6">
        {[
          {
            title: "Cargas en Tránsito Total",
            value: categoryStats.enTransito.total || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-red-500" />,
            onClick: () => handleCategoryClick("enTransito"),
          },
          {
            title: "Cargas Próximas Para la Próxima Semana",
            value: categoryStats.enTransito.sevenDays || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-red-500" />,
            onClick: () => handleCategoryClick("enTransito", "sevenDays"),
          },
          {
            title: "Cargas Próximas Para la Próxima Quincena",
            value: categoryStats.enTransito.fifteenDays || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-red-500" />,
            onClick: () => handleCategoryClick("enTransito", "fifteenDays"),
          },
        ].map((d, k) => (
          <DashboardStats key={k} {...d} colorIndex={k} />
        ))}
      </div>

      {/* Estadísticas Totales para las demás categorías */}
      <div className="grid lg:grid-cols-3 mt-4 md:grid-cols-2 grid-cols-1 gap-6">
        {[
          {
            title: "Cargas en Origen",
            value: categoryStats.origen || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-blue-500" />,
            onClick: () => handleCategoryClick("origen"),
          },
          {
            title: "Cargas en Pto Entrada",
            value: categoryStats.ptoEntrada || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-purple-500" />,
            onClick: () => handleCategoryClick("ptoEntrada"),
          },
          {
            title: "Cargas en Bodega Pendiente de Descarga",
            value: categoryStats.pendienteDescarga || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-teal-500" />,
            onClick: () => handleCategoryClick("pendienteDescarga"),
          },
        ].map((d, k) => (
          <DashboardStats key={k} {...d} colorIndex={k} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 mt-4 md:grid-cols-2 grid-cols-1 gap-6">
        {[
          {
            title: "Cargas en Bodega HUB Panamá",
            value: categoryStats.hubPanama || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-blue-500" />,
            onClick: () => handleCategoryClick("hubPanama"),
          },
          {
            title: "Cargas en CFS Panamá (Inventario LATAM)",
            value: categoryStats.cfsPanama || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-purple-500" />,
            onClick: () => handleCategoryClick("cfsPanama"),
          },
          {
            title: "Cargas en Movimiento de Panamá a Costa Rica (CRC)",
            value: categoryStats.movimientoPanamaCrc || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-teal-500" />,
            onClick: () => handleCategoryClick("movimientoPanamaCrc"),
          },
        ].map((d, k) => (
          <DashboardStats key={k} {...d} colorIndex={k} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 mt-4 md:grid-cols-2 grid-cols-1 gap-6">
        {[
          {
            title: "Cargas en Almacén Destino",
            value: categoryStats.almacenDestino || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-blue-500" />,
            onClick: () => handleCategoryClick("almacenDestino"),
          },
          {
            title: "Cargas Pendientes de Archivar",
            value: categoryStats.archivar || 0,
            icon: <CircleStackIcon className="w-8 h-8 text-purple-500" />,
            onClick: () => handleCategoryClick("archivar"),
          },
        ].map((d, k) => (
          <DashboardStats key={k} {...d} colorIndex={k} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-1 mt-4 grid-cols-1 gap-6">
        <DoughnutChart
          title="Cargas por Cliente"
          data={Object.keys(chartData.client).map((key) => ({
            label: key,
            value: chartData.client[key],
            id: key, // ID necesario para el filtro
          }))}
          onSliceClick={(data) => handleCircleClick("client", data)} // Enlazar con el evento clic
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          title={modalTitle}
          onClose={() => setIsModalOpen(false)} // Cerrar modal
        >
          <DataTable
            data={modalData} // Datos formateados
            columns={[
              { label: "IDTRA", key: "idtra" },
              { label: "CLIENTE", key: "nombreCliente" },
              { label: "STATUS", key: "status" },
              { label: "CANT. EQUIPO", key: "cantidadEquipo" },
              { label: "TAMAÑO EQUIPO", key: "tamanoEquipo" },
              { label: "BULTOS", key: "bultos" },
              { label: "PESO", key: "peso" },
              { label: "PO", key: "po" },
              { label: "POL", key: "pol" },
            ]}
          />
        </Modal>
      )}
    </>
  );
}

export default Dashboard;
