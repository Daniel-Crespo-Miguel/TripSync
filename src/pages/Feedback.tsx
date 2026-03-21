import { useParams } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { useGroup } from "../contexts/GroupContext";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackDashboard from "../components/FeedbackDashboard";

function Feedback() {
  const { grupo } = useGroup();
  const { id } = useParams();
  const user = auth.currentUser;

  if (!user || !grupo) {
    return <div className="container mt-4">Cargando...</div>;
  }

  return (
    <div className="feedback-page">
      <div className="feedback-intro">
        <div className="feedback-intro-icon">💬</div>
        <h1 className="feedback-intro-title">¿Cómo valoras el viaje?</h1>
        <p className="feedback-intro-subtitle">
          Escribe libremente y nuestra IA analizará el sentimiento de tu mensaje
        </p>
      </div>

      <FeedbackDashboard groupId={id!} />

      <FeedbackForm
        userEmail={user.email ?? ""}
        userId={user.uid}
        groupId={id!}
      />
    </div>
  );
}

export default Feedback;
