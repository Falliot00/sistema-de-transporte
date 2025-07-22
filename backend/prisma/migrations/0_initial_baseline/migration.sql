BEGIN TRY

BEGIN TRAN;

-- Crear esquemas si no existen
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'alarmas')
BEGIN
    EXEC('CREATE SCHEMA [alarmas]')
END

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dimCentral')
BEGIN
    EXEC('CREATE SCHEMA [dimCentral]')
END

-- CreateTable: Anomalia
CREATE TABLE [alarmas].[anomalia] (
    [idAnomalia] INT NOT NULL,
    [nomAnomalia] VARCHAR(255),
    [descAnomalia] VARCHAR(512),
    CONSTRAINT [PK_anomalia] PRIMARY KEY CLUSTERED ([idAnomalia])
);

-- CreateTable: Empresa
CREATE TABLE [dimCentral].[empresa] (
    [idEmp] INT NOT NULL,
    [Empresa] NVARCHAR(255),
    [EmpresaAbr] VARCHAR(10),
    [EmpresaMin] VARCHAR(100),
    [EmpresaNSSA] INT,
    CONSTRAINT [PK_empresa] PRIMARY KEY CLUSTERED ([idEmp])
);

-- CreateTable: Dispositivos
CREATE TABLE [alarmas].[dispositivos] (
    [id] INT NOT NULL,
    [nroInterno] INT,
    [patente] NVARCHAR(255),
    [idDispositivo] INT NOT NULL,
    [did] INT,
    [sim] VARCHAR(20),
    CONSTRAINT [PK_dispositivos] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_dispositivos_idDispositivo] UNIQUE NONCLUSTERED ([idDispositivo])
);

-- CreateTable: TypeAlarms
CREATE TABLE [alarmas].[typeAlarms] (
    [type] INT NOT NULL,
    [alarm] VARCHAR(200),
    CONSTRAINT [PK_typeAlarms] PRIMARY KEY CLUSTERED ([type])
);

-- CreateTable: Choferes (empleados)
CREATE TABLE [dimCentral].[empleados] (
    [idEmpleado] INT NOT NULL,
    [apellido_nombre] NVARCHAR(255) NOT NULL,
    [foto] VARCHAR(255),
    [DNI] NVARCHAR(50),
    [legajo] INT,
    [idEmpresa] INT,
    [sector] NVARCHAR(255),
    [puesto] NVARCHAR(255),
    [Estado] NVARCHAR(50),
    [LiquidacionEstado] NVARCHAR(50),
    CONSTRAINT [PK_empleados] PRIMARY KEY CLUSTERED ([idEmpleado])
);

-- CreateTable: AlarmasHistorico
CREATE TABLE [alarmas].[alarmasHistorico] (
    [guid] VARCHAR(50) NOT NULL,
    [dispositivo] INT,
    [idinterno] VARCHAR(20),
    [alarmType] INT,
    [velocidad] FLOAT(53),
    [lng] VARCHAR(20),
    [lat] VARCHAR(20),
    [ubi] VARCHAR(50),
    [alarmTime] DATETIME,
    [imagen] VARCHAR(512),
    [video] VARCHAR(512),
    [estado] VARCHAR(50),
    [descripcion] VARCHAR(512),
    [chofer] INT,
    [idAnomalia] INT,
    [idEmpresa] INT,
    CONSTRAINT [PK_alarmasHistorico] PRIMARY KEY CLUSTERED ([guid])
);

-- CreateTable: Sysdiagrams
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK_sysdiagrams] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- AddForeignKeys
ALTER TABLE [alarmas].[alarmasHistorico] ADD CONSTRAINT [FK_alarmasHistorico_chofer] 
    FOREIGN KEY ([chofer]) REFERENCES [dimCentral].[empleados]([idEmpleado]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [alarmas].[alarmasHistorico] ADD CONSTRAINT [FK_alarmasHistorico_typeAlarm] 
    FOREIGN KEY ([alarmType]) REFERENCES [alarmas].[typeAlarms]([type]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [alarmas].[alarmasHistorico] ADD CONSTRAINT [FK_alarmasHistorico_dispositivo] 
    FOREIGN KEY ([dispositivo]) REFERENCES [alarmas].[dispositivos]([idDispositivo]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [alarmas].[alarmasHistorico] ADD CONSTRAINT [FK_alarmasHistorico_anomalia] 
    FOREIGN KEY ([idAnomalia]) REFERENCES [alarmas].[anomalia]([idAnomalia]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [alarmas].[alarmasHistorico] ADD CONSTRAINT [FK_alarmasHistorico_empresa] 
    FOREIGN KEY ([idEmpresa]) REFERENCES [dimCentral].[empresa]([idEmp]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dimCentral].[empleados] ADD CONSTRAINT [FK_empleados_empresa] 
    FOREIGN KEY ([idEmpresa]) REFERENCES [dimCentral].[empresa]([idEmp]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

