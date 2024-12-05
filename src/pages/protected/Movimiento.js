import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/common/headerSlice";
import Movimiento from "../../features/movimiento";

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: "Reporte Movimiento Panamá-CRC" }));
  }, []);

  return <Movimiento />;
}

export default InternalPage;
