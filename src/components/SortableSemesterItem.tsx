import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import type { SemesterWithCourses } from '../types';

interface SortableSemesterItemProps {
    semester: SemesterWithCourses;
    isFirst: boolean;
    isLast: boolean;
    onDelete: (id: string) => void;
    onClick: () => void;
    onMoveUp: (e: React.MouseEvent) => void;
    onMoveDown: (e: React.MouseEvent) => void;
}

export function SortableSemesterItem({
    semester,
    isFirst,
    isLast,
    onDelete,
    onClick,
    onMoveUp,
    onMoveDown
}: SortableSemesterItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: semester.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors cursor-pointer ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{semester.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {semester.courses.length} courses • {semester.courses.reduce((sum, c) => sum + c.credit, 0)} credits
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={isFirst}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveUp(e);
                            }}
                        >
                            <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={isLast}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveDown(e);
                            }}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="text-right min-w-[80px]">
                        <p className="text-sm text-muted-foreground">GPA</p>
                        <p className="text-2xl font-bold text-primary">
                            {semester.semesterGPA10?.toFixed(2) || '--'}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(semester.id);
                        }}
                    >
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
