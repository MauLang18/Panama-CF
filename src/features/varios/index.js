import { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";
import TitleCard from "../../components/Cards/TitleCard";
import { showNotification } from "../common/headerSlice";
import { useDispatch } from "react-redux";

// Importación de los archivos JSON
import poeMapping from "../../data/poe.json";
import tamanoEquipoMapping from "../../data/tamanoEquipo.json";
import LeadDocument from "./components/LeadDocument";

function Varios() {
  const [varios, setVarios] = useState([]);
  const [filter, setFilter] = useState("0");
  const [textFilter, setTextFilter] = useState("");
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const dispatch = useDispatch();

  const fetchVarios = async (filterValue, textValue) => {
    try {
      const response = await fetch(
        `https://api.logisticacastrofallas.com/api/Panama?numFilter=${filterValue}&textFilter=${textValue}&type=1`
      );
      const data = await response.json();
      if (data.isSuccess) {
        const variosData = data.data.value;

        // Actualizar los estados
        setVarios(variosData);
      } else {
        dispatch(showNotification({ message: data.message, type: "error" }));
      }
    } catch (error) {
      dispatch(
        showNotification({ message: "Error fetching varios", type: "error" })
      );
    }
  };

  useEffect(() => {
    fetchVarios(filter, textFilter);
  }, [filter, textFilter]);

  const openLeadModal = (lead) => {
    setModalContent(<LeadDocument lead={lead} />);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setModalOpen(false);
  };

  const renderBooleanBadge = (value) => (
    <div className={`badge ${value ? "badge-success" : "badge-error"}`}>
      {value ? "Sí" : "No"}
    </div>
  );

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleTextFilterChange = (e) => {
    setTextFilter(e.target.value);
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get(
        "https://api.logisticacastrofallas.com/api/Panama/Download?numFilter=0&type=1",
        {
          responseType: "blob", // Asegurarse de que se reciba el archivo como un Blob
        }
      );

      // Crear una URL para el archivo Blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Crear un enlace temporal para la descarga
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reporte_varios.xlsx"); // Nombre del archivo

      // Añadir el enlace al documento y hacer clic en él para iniciar la descarga
      document.body.appendChild(link);
      link.click();

      // Remover el enlace temporal del DOM
      document.body.removeChild(link);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Error al descargar el archivo",
          type: "error",
        })
      );
    }
  };

  const getPoeName = (poe) => poeMapping[poe] || "";
  const getTamanoEquipoName = (tamanoEquipo) =>
    tamanoEquipoMapping[tamanoEquipo] || "";

  return (
    <>
      <TitleCard title="Reporte Varios" topMargin="mt-2">
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <select
              className="select select-primary"
              value={filter}
              onChange={handleFilterChange}
            >
              <option value="0">Todos</option>
              <option value="1">Cliente</option>
              <option value="2">Contenedor</option>
              <option value="5">PO</option>
              <option value="6">IDTRA</option>
            </select>
            <input
              type="text"
              className="input input-primary"
              value={textFilter}
              onChange={handleTextFilterChange}
              placeholder="Buscar..."
            />
            <button
              className="btn btn-primary ml-4"
              onClick={handleDownloadExcel}
            >
              Descargar Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="table w-full">
            <thead>
              <tr>
                <th>IDTRA</th>
                <th>Cliente</th>
                <th>POE</th>
                <th>Fecha ETA</th>
                <th>Contenedor</th>
                <th>Tamaño de Equipo</th>
                <th>Peso</th>
                <th>Cantidad de Bultos</th>
                <th>Status</th>
                <th>Fecha de Status</th>
                <th>Comentarios OverNight</th>
                <th>Actualización OverNight</th>
                <th>PO</th>
                <th>Commodity</th>
                <th>Aplica Certificado Origen</th>
              </tr>
            </thead>
            <tbody>
              {varios.map((lead) => (
                <tr key={lead.incidentid} className="cursor-pointer">
                  <td
                    className="text-blue-600 underline decoration-blue-600"
                    onClick={() => openLeadModal(lead)}
                  >
                    {lead.title}
                  </td>
                  <td>{lead._customerid_value}</td>

                  <td>{getPoeName(lead.new_poe)}</td>
                  <td>
                    {lead.new_eta
                      ? moment(lead.new_eta).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>{lead.new_contenedor}</td>
                  <td>{getTamanoEquipoName(lead.new_tamaoequipo)}</td>
                  <td>{lead.new_peso}</td>
                  <td>{lead.new_contidadbultos}</td>
                  <td>{lead.new_statuscliente}</td>
                  <td>
                    {lead.new_fechastatus
                      ? moment(lead.new_fechastatus).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>{lead.new_comentariosovernight}</td>
                  <td>
                    {lead.new_actualizacionovernight
                      ? moment(lead.new_actualizacionovernight).format(
                          "DD MMM YY"
                        )
                      : "N/A"}
                  </td>
                  <td>{lead.new_po}</td>
                  <td>{lead.new_commodity}</td>
                  <td>
                    {renderBooleanBadge(lead.new_aplicacertificadodeorigen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TitleCard>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl z-50">
            {modalContent}
            <div className="modal-action">
              <button className="btn" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Varios;
