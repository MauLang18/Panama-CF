import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/common/headerSlice";
import Hub from "../../features/hub";

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: "Reporte Cargas Hub Panamá" }));
  }, []);

  return <Hub />;
}

export default InternalPage;
