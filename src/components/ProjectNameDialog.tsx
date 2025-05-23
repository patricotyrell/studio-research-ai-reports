
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectNameDialogProps {
  open: boolean;
  onConfirm: (projectName: string) => void;
  defaultName?: string;
  title?: string;
  description?: string;
}

const ProjectNameDialog: React.FC<ProjectNameDialogProps> = ({
  open,
  onConfirm,
  defaultName = '',
  title = "Name Your Project",
  description = "Give your research project a descriptive name to help you identify it later."
}) => {
  const [projectName, setProjectName] = useState(defaultName);

  const handleConfirm = () => {
    if (projectName.trim()) {
      onConfirm(projectName.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">
              Name
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="col-span-3"
              placeholder="e.g., Customer Feedback Spring 2024"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleConfirm} 
            disabled={!projectName.trim()}
            className="bg-research-700 hover:bg-research-800"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectNameDialog;
