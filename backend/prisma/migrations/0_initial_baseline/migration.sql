BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[alarmasHistorico] (
    [guid] VARCHAR(50) NOT NULL,
    [dispositivo] VARCHAR(20),
    [interno] VARCHAR(20),
    [alarmType] INT,
    [velocidad] FLOAT(53),
    [lng] VARCHAR(20),
    [lat] VARCHAR(20),
    [ubi] VARCHAR(50),
    [patente] VARCHAR(20),
    [alarmTime] DATETIME,
    [Empresa] VARCHAR(100),
    [imagen] VARCHAR(512),
    [video] VARCHAR(512),
    [estado] VARCHAR(50),
    [descripcion] VARCHAR(512),
    [chofer] INT,
    CONSTRAINT [PK__alarmasH__497F6CB4A51B299D] PRIMARY KEY CLUSTERED ([guid])
);

-- CreateTable
CREATE TABLE [dbo].[typeAlarms] (
    [type] INT NOT NULL,
    [alarm] VARCHAR(200),
    CONSTRAINT [PK__typeAlar__E3F852490A79947F] PRIMARY KEY CLUSTERED ([type])
);

-- CreateTable
CREATE TABLE [dbo].[choferes] (
    [choferes_id] INT NOT NULL,
    [nombre] VARCHAR(50) NOT NULL,
    [apellido] VARCHAR(50) NOT NULL,
    [foto] VARCHAR(255),
    [dni] VARCHAR(50),
    [anios] INT,
    [empresa] VARCHAR(50),
    CONSTRAINT [PK_choferes] PRIMARY KEY CLUSTERED ([choferes_id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B61364CBE63] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

