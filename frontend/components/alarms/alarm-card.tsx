import { Alarm } from "@/types";
import { formatDate, getStatusColor, getStatusText, getTypeColor, getTypeText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Camera, Clock, MapPin, User } from "lucide-react";

interface AlarmCardProps {
  alarm: Alarm;
  onClick: (alarm: Alarm) => void;
}

export function AlarmCard({ alarm, onClick }: AlarmCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => onClick(alarm)}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-semibold">{alarm.id}</div>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(alarm.status)}>
              {getStatusText(alarm.status)}
            </Badge>
            <Badge className={getTypeColor(alarm.type)}>
              {getTypeText(alarm.type)}
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <Clock className="h-4 w-4 inline mr-1" />
          {formatDate(alarm.timestamp)}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{alarm.driver.name}</span>
              <span className="text-xs text-muted-foreground">Licencia: {alarm.driver.license}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{alarm.device.name}</span>
              <span className="text-xs text-muted-foreground">SN: {alarm.device.serialNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{alarm.location.address || 'Ubicación no disponible'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span>{alarm.media.length} archivos</span>
            </div>
            {alarm.reviewer && (
              <div className="text-xs ml-2">
                <span className="text-muted-foreground">Revisado por: </span>
                {alarm.reviewer.name}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}