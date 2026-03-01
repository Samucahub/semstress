import { DocumentsList } from '@/components/DocumentsList';

export default function ProjectDetailsPage() {
  const projectId = "uuid-do-projeto";
  
  return (
    <div>
      {}
      
      {}
      <div className="mt-8">
        <DocumentsList projectId={projectId} />
      </div>
    </div>
  );
}

export function TaskDetailsPage() {
  const taskId = "uuid-da-tarefa";
  
  return (
    <div>
      {}
      
      {}
      <div className="mt-8">
        <DocumentsList taskId={taskId} />
      </div>
    </div>
  );
}

// Exemplo de uso sem botão de criar (apenas visualização)
export function ReadOnlyDocumentsView() {
  return (
    <DocumentsList 
      projectId="uuid-do-projeto" 
      showCreateButton={false} 
    />
  );
}
