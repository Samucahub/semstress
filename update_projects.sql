
UPDATE "Project" 
SET "isCollaborative" = true 
WHERE id IN (
  SELECT DISTINCT "projectId" FROM "ProjectMember"
);

UPDATE "Project" 
SET "isCollaborative" = false 
WHERE id NOT IN (
  SELECT DISTINCT "projectId" FROM "ProjectMember"
);
