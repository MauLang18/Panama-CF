import { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";
import TitleCard from "../../components/Cards/TitleCard";
import { showNotification } from "../common/headerSlice";
import { useDispatch } from "react-redux";

// Importación de los archivos JSON
import polMapping from "../../data/pol.json";
import poeMapping from "../../data/poe.json";
import statusMapping from "../../data/status.json";
import cantEquipoMapping from "../../data/cantEquipo.json";
import tamanoEquipoMapping from "../../data/tamanoEquipo.json";
import ejecutivoMapping from "../../data/ejecutivo.json";
import LeadDocument from "./components/LeadDocument";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [documents, setDocuments] = useState({});
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("0");
  const [textFilter, setTextFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const isDateFilter = ["8", "10", "12", "13"].includes(filter);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleTextFilterChange = (e) => {
    setTextFilter(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const documentFields = [
    "new_facturacomercial",
    "new_traducciondefacturas",
    "new_listadeempaque",
    "new_draftbl",
    "new_bloriginal",
    "new_cartatrazabilidad",
    "new_cartadesglosecargos",
    "new_exoneracion",
    "new_borradordecertificadodeorigen",
    "new_certificadoorigen",
    "new_certificadoreexportacion",
    "new_cartaporte",
    "new_manifiestoenlace",
    "new_ducatenlace",
    "new_blnavieraswb",
    "new_cartaliberacionnaviera",
    "new_dmcentradaenlace",
    "new_tienlace",
    "new_dmcsalidaenlace",
  ];

  const fetchLeads = async (filterValue, textValue) => {
    try {
      const response = await fetch(
        `https://api.logisticacastrofallas.com/api/Panama?numFilter=${filterValue}&textFilter=${textValue}&type=0`
      );
      const data = await response.json();
      if (data.isSuccess) {
        const leadsData = data.data.value;

        // Crear un objeto de documentos
        const initialDocuments = leadsData.reduce((acc, lead) => {
          acc[lead.incidentid] = {
            new_facturacomercial: lead.new_facturacomercial || null,
            new_listadeempaque: lead.new_listadeempaque || null,
            new_draftbl: lead.new_draftbl || null,
            new_bloriginal: lead.new_bloriginal || null,
            new_cartatrazabilidad: lead.new_cartatrazabilidad || null,
            new_cartadesglosecargos: lead.new_cartadesglosecargos || null,
            new_exoneracion: lead.new_exoneracion || null,
            new_certificadoorigen: lead.new_certificadoorigen || null,
            new_certificadoreexportacion:
              lead.new_certificadoreexportacion || null,
            new_permisos: lead.new_permisos || null,
            new_borradordeimpuestos: lead.new_borradordeimpuestos || null,
            new_documentodenacionalizacion:
              lead.new_documentodenacionalizacion || null,
            new_borradordecertificadodeorigen:
              lead.new_borradordecertificadodeorigen || null,
            new_traducciondefacturas: lead.new_traducciondefacturas || null,
          };
          return acc;
        }, {});

        // Actualizar los estados
        setDocuments(initialDocuments); // Establecer los documentos
        setLeads(leadsData);
      } else {
        dispatch(showNotification({ message: data.message, type: "error" }));
      }
    } catch (error) {
      dispatch(
        showNotification({ message: "Error fetching leads", type: "error" })
      );
    }
  };

  useEffect(() => {
    fetchLeads(filter, textFilter);
  }, [filter, textFilter]);

  const handleFileUpload = async (file, leadId, fieldName) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("transInternacionalId", leadId);
    formData.append("fieldName", fieldName);

    try {
      const response = await axios.patch(
        "https://api.logisticacastrofallas.com/api/Panama/Upload",
        formData
      );

      if (response.data.isSuccess) {
        dispatch(
          showNotification({
            message: "Documento subido con éxito",
            type: "success",
          })
        );

        setDocuments((prev) => ({
          ...prev,
          [leadId]: {
            ...prev[leadId],
            [fieldName]: response.data.fileUrl,
          },
        }));
      } else {
        dispatch(
          showNotification({ message: response.data.message, type: "error" })
        );
      }
    } catch (error) {
      dispatch(
        showNotification({
          message: "Error al subir el documento",
          type: "error",
        })
      );
    }
  };

  const handleFileDelete = async (leadId, fieldName) => {
    const fileUrl = documents[leadId]?.[fieldName]; // Obtener la URL del archivo del estado local

    if (!fileUrl) {
      dispatch(
        showNotification({
          message: "No hay archivo para eliminar",
          type: "warning",
        })
      );
      return;
    }

    try {
      // Crear un objeto FormData
      const formData = new FormData();
      formData.append("transInternacionalId", leadId);
      formData.append("fieldName", fieldName);
      formData.append("fileUrl", fileUrl);

      const response = await axios.patch(
        `https://api.logisticacastrofallas.com/api/Panama/RemoveFile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.isSuccess) {
        dispatch(
          showNotification({
            message: "Archivo eliminado con éxito",
            type: "success",
          })
        );

        // Actualizar el estado local para reflejar la eliminación
        setDocuments((prev) => ({
          ...prev,
          [leadId]: {
            ...prev[leadId],
            [fieldName]: null,
          },
        }));
      } else {
        dispatch(
          showNotification({ message: response.data.message, type: "error" })
        );
      }
    } catch (error) {
      dispatch(
        showNotification({
          message: "Error al eliminar el archivo",
          type: "error",
        })
      );
    }
  };

  const openDocumentModal = (url) => {
    setModalContent(
      <iframe src={url} title="Documento PDF" className="w-full h-96"></iframe>
    );
    setModalOpen(true);
  };

  const openLeadModal = (lead) => {
    //setModalContent(<LeadDocument lead={lead} />);
    //setModalOpen(true);
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

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get(
        "https://api.logisticacastrofallas.com/api/Panama/Download?numFilter=0&type=0",
        {
          responseType: "blob", // Asegurarse de que se reciba el archivo como un Blob
        }
      );

      // Crear una URL para el archivo Blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Crear un enlace temporal para la descarga
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "panama.xlsx"); // Nombre del archivo

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

  const getPolName = (pol) => polMapping[pol] || "";
  const getPoeName = (poe) => poeMapping[poe] || "";
  const getStatusName = (status) => statusMapping[status] || "";
  const getCantEquipoName = (cantEquipo) => cantEquipoMapping[cantEquipo] || "";
  const getTamanoEquipoName = (tamanoEquipo) =>
    tamanoEquipoMapping[tamanoEquipo] || "";

  return (
    <>
      <TitleCard title="Panamá" topMargin="mt-2">
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
              <option value="3">BCF</option>
              <option value="4">Factura</option>
              <option value="5">PO</option>
              <option value="6">IDTRA</option>
              <option value="7">DMC Entrada</option>
              <option value="8">Fecha DMC Entrada</option>
              <option value="9">DMC Salida</option>
              <option value="10">Fecha DMC Salida</option>
              <option value="11">TI</option>
              <option value="12">Fecha TI</option>
            </select>

            {/* Campo de texto o fecha dependiendo de la opción seleccionada */}
            {isDateFilter ? (
              <input
                type="date"
                className="input input-primary"
                value={dateFilter}
                onChange={handleDateFilterChange}
              />
            ) : (
              <input
                type="text"
                className="input input-primary"
                value={textFilter}
                onChange={handleTextFilterChange}
                placeholder="Buscar..."
              />
            )}

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
                {/* Columnas existentes */}
                <th>IDTRA</th>
                <th>ESTADO</th>
                <th>CLIENTE</th>
                <th>CANTIDAD DE EQUIPO</th>
                <th>TAMAÑO DE EQUIPO</th>
                <th># CONTENEDOR</th>
                <th>CANTIDAD DE BULTOS</th>
                <th>PESO</th>
                <th>PO</th>
                <th># FACTURA</th>
                <th>COMMODITY</th>
                <th>BCF</th>
                <th>POL</th>
                <th>POE</th>
                <th>ETA</th>
                <th>ULTIMO DIA LIBRE CONTENEDOR</th>
                <th>FECHA SALIDA PTY</th>
                <th>FECHA LLEGADA CRC</th>
                <th>CERTIFICADO ORIGEN</th>
                <th>CERTIFICADO REEXPORTACIÓN</th>
                <th>PAGO NAVIERA REALIZADO</th>
                <th>ENTREGA BL ORIGINAL</th>
                <th>ENTREGA CARTA DE TRAZABILIDAD</th>
                <th>FECHA BL IMPRESO</th>
                <th>ENTREGA DE TRADUCCIÓN</th>
                <th>FECHA DMC ENTRADA</th>
                <th>FECHA TI</th>
                <th>FECHA CARGA HUB PANAMA</th>
                <th>FECHA DMC SALIDA</th>
                <th>FECHA REALIZAR CERT. REEXPORTACION</th>
                <th>LIBERACIÓN DOCUMENTAL</th>
                <th>LIBERACIÓN FINANCIERA</th>
                <th># DMC ENTRADA</th>
                <th># IT</th>
                <th># DMC SALIDA</th>
                <th>FECHA STATUS CLIENTE</th>
                <th>STATUS CLIENTE</th>
                {/* Nuevas columnas de documentos */}
                {documentFields.map((field) => (
                  <th key={field}>{field.replace("new_", "").toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.incidentid} className="cursor-pointer">
                  {/* Mapeo de las columnas con datos existentes */}
                  <td
                    className="text-blue-600 underline decoration-blue-600"
                    onClick={() => openLeadModal(lead)}
                  >
                    {lead.title}
                  </td>
                  <td>{getStatusName(lead.new_preestado2)}</td>
                  <td>{lead._customerid_value}</td>
                  <td>{getCantEquipoName(lead.new_cantequipo)}</td>
                  <td>{getTamanoEquipoName(lead.new_tamaoequipo)}</td>
                  <td>{lead.new_contenedor}</td>
                  <td>{lead.new_contidadbultos}</td>
                  <td>{lead.new_peso}</td>
                  <td>{lead.new_po}</td>
                  <td>{lead.new_factura}</td>
                  <td>{lead.new_commodity}</td>
                  <td>{lead.new_bcf}</td>
                  <td>{getPolName(lead.new_pol)}</td>
                  <td>{getPoeName(lead.new_poe)}</td>
                  <td>
                    {lead.new_eta
                      ? moment(lead.new_eta).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>{lead.new_ultimodialibrecontenedor}</td>
                  <td>
                    {lead.new_fechasalidapty
                      ? moment(lead.new_fechasalidapty).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechallegadacrc
                      ? moment(lead.new_fechallegadacrc).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>{renderBooleanBadge(lead.new_certificadoorigen)}</td>
                  <td>
                    {renderBooleanBadge(lead.new_certificadoreexportacion)}
                  </td>
                  <td>{renderBooleanBadge(lead.new_pagonavierarealizado)}</td>
                  <td>{renderBooleanBadge(lead.new_entregablo)}</td>
                  <td>
                    {renderBooleanBadge(lead.new_entregacargatrazabilidad)}
                  </td>
                  <td>
                    {lead.new_fechablimpreso
                      ? moment(lead.new_fechablimpreso).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechatraduccion
                      ? moment(lead.new_fechatraduccion).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechadmcentrada
                      ? moment(lead.new_fechadmcentrada).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechati
                      ? moment(lead.new_fechati).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechacargahubpanama
                      ? moment(lead.new_fechacargahubpanama).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechadmcsalida
                      ? moment(lead.new_fechadmcsalida).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fecharealizarcertreexportacion
                      ? moment(lead.new_fecharealizarcertreexportacion).format(
                          "DD MMM YY"
                        )
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechaliberaciondocumental
                      ? moment(lead.new_fechaliberaciondocumental).format(
                          "DD MMM YY"
                        )
                      : "N/A"}
                  </td>
                  <td>
                    {lead.new_fechaliberacionfinanciera
                      ? moment(lead.new_fechaliberacionfinanciera).format(
                          "DD MMM YY"
                        )
                      : "N/A"}
                  </td>
                  <td>{lead.new_dmcentrada}</td>
                  <td>{lead.new_ti}</td>
                  <td>{lead.new_dmcsalida}</td>
                  <td>
                    {lead.new_fechastatus
                      ? moment(lead.new_fechastatus).format("DD MMM YY")
                      : "N/A"}
                  </td>
                  <td>{lead.new_statuscliente}</td>
                  {/* Generar filas para los campos de documento */}
                  {documentFields.map((field) => (
                    <td key={field}>
                      {documents[lead.incidentid]?.[field] ? (
                        <div className="flex flex-col space-y-2">
                          <button
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDocumentModal(
                                documents[lead.incidentid][field]
                              );
                            }}
                          >
                            Ver
                          </button>
                          <button
                            className="btn btn-error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDelete(lead.incidentid, field);
                            }}
                          >
                            Eliminar
                          </button>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) =>
                              handleFileUpload(
                                e.target.files[0],
                                lead.incidentid,
                                field
                              )
                            }
                          />
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            handleFileUpload(
                              e.target.files[0],
                              lead.incidentid,
                              field
                            )
                          }
                        />
                      )}
                    </td>
                  ))}
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

export default Leads;
