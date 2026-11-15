"""Preguntas específicas para las cláusulas 4 a 10 y los controles A.5 a A.7 de ISO/IEC 27001:2022.

Reemplazan a las preguntas de plantilla del catálogo ("¿Existe documentación formal que
cubra 'X'?"). Están redactadas por el equipo a partir del propósito de cada requisito y
control; no reproducen el texto de la norma. Cada entrada tiene tres preguntas: si el
requisito está definido, si se aplica en la práctica y si se revisa o se prueba.
"""

PREGUNTAS = {
    # ------------------------------------------------------------------ Cláusula 4
    "4.1": [
        ("¿La organización identificó los factores internos y externos que afectan su seguridad de la información (regulación, tecnología, competencia, cultura interna)?", "Análisis de contexto (FODA, PESTEL o similar) con fecha y autor"),
        ("¿Ese análisis de contexto se usó para definir el alcance y los riesgos del sistema de gestión?", "Referencias del análisis de contexto en el documento de alcance o en la evaluación de riesgos"),
        ("¿El análisis de contexto se actualiza cuando hay cambios relevantes, como nuevos servicios, sedes o leyes?", "Historial de versiones del análisis de contexto"),
    ],
    "4.2": [
        ("¿Existe una lista de partes interesadas (clientes, reguladores, proveedores, trabajadores) con lo que cada una espera en seguridad de la información?", "Matriz de partes interesadas y sus requisitos"),
        ("¿Se identificaron los requisitos legales y contractuales que aplican, como la Ley 21.719 y los contratos con clientes?", "Registro de requisitos legales, regulatorios y contractuales"),
        ("¿Se define cuáles de esos requisitos se abordan a través del sistema de gestión y se revisan periódicamente?", "Matriz de requisitos con responsable y fecha de revisión"),
    ],
    "4.3": [
        ("¿El alcance del sistema de gestión está documentado e indica qué procesos, sedes, sistemas y unidades cubre?", "Documento de alcance aprobado"),
        ("¿El alcance justifica las exclusiones y describe las interfaces y dependencias con terceros?", "Sección de exclusiones e interfaces del documento de alcance"),
        ("¿El alcance está disponible para las partes interesadas que lo necesitan, como auditores y clientes?", "Publicación del alcance o constancia de su entrega"),
    ],
    "4.4": [
        ("¿La organización estableció un sistema de gestión de seguridad de la información con sus procesos y cómo se relacionan entre sí?", "Mapa de procesos del SGSI"),
        ("¿Los procesos del sistema de gestión tienen responsables, entradas, salidas e indicadores definidos?", "Fichas de proceso con responsable e indicadores"),
        ("¿Hay evidencia de que el sistema de gestión se mantiene y mejora, y no solo existe en documentos?", "Actas de seguimiento, indicadores medidos y acciones de mejora registradas"),
    ],
    # ------------------------------------------------------------------ Cláusula 5
    "5.1": [
        ("¿La alta dirección asignó recursos (presupuesto, personas, herramientas) al sistema de gestión de seguridad de la información?", "Presupuesto aprobado o actas de asignación de recursos"),
        ("¿La dirección participa en las decisiones de seguridad, por ejemplo aprobando la política y los riesgos aceptados?", "Actas de comité con participación de la dirección"),
        ("¿La dirección comunica la importancia de la seguridad de la información al personal?", "Comunicados internos, presentaciones o mensajes de la dirección"),
    ],
    "5.2": [
        ("¿Existe una política de seguridad de la información aprobada por la alta dirección, con objetivos o un marco para fijarlos?", "Política de seguridad firmada y fechada"),
        ("¿La política incluye el compromiso de cumplir los requisitos aplicables y de mejorar continuamente?", "Texto de la política con esos compromisos"),
        ("¿La política se comunicó a todo el personal y está disponible para las partes interesadas que corresponda?", "Registro de difusión o acuse de recibo de la política"),
    ],
    "5.3": [
        ("¿Están definidos y asignados los roles y responsabilidades de seguridad de la información, incluido un responsable del sistema de gestión?", "Organigrama de seguridad o matriz de responsabilidades (RACI)"),
        ("¿Las personas con esos roles conocen sus responsabilidades y las aceptaron formalmente?", "Descripciones de cargo firmadas o designaciones formales"),
        ("¿Existe un responsable de informar a la dirección sobre el desempeño del sistema de gestión?", "Designación formal e informes entregados a la dirección"),
    ],
    # ------------------------------------------------------------------ Cláusula 6
    "6.1": [
        ("¿Existe una metodología de evaluación de riesgos con criterios definidos de probabilidad, impacto y aceptación del riesgo?", "Metodología de gestión de riesgos aprobada"),
        ("¿Se realizó una evaluación de riesgos que identifica activos, amenazas, vulnerabilidades y responsables de cada riesgo?", "Matriz de riesgos con responsables y fecha"),
        ("¿La evaluación de riesgos se repite periódicamente y cuando hay cambios importantes, con resultados comparables?", "Evaluaciones de riesgo de distintos periodos"),
    ],
    "6.1.3": [
        ("¿Existe un plan de tratamiento de riesgos que indica, para cada riesgo, si se mitiga, transfiere, evita o acepta?", "Plan de tratamiento de riesgos"),
        ("¿Existe una Declaración de Aplicabilidad (SOA) que justifica la inclusión o exclusión de cada control del Anexo A?", "Declaración de Aplicabilidad aprobada"),
        ("¿Los dueños de los riesgos aprobaron el plan de tratamiento y aceptaron formalmente los riesgos residuales?", "Firma o acta de aceptación de riesgos residuales"),
    ],
    "6.2": [
        ("¿Se definieron objetivos de seguridad de la información medibles y coherentes con la política?", "Documento de objetivos con indicadores y metas"),
        ("¿Cada objetivo tiene responsable, recursos, plazo y forma de evaluar el resultado?", "Plan de objetivos con responsable y fecha"),
        ("¿Se mide periódicamente el avance de los objetivos y se informa a la dirección?", "Reporte de avance de objetivos"),
    ],
    "6.3": [
        ("¿Los cambios al sistema de gestión (alcance, procesos, controles) se planifican antes de ejecutarse?", "Registro o procedimiento de gestión de cambios del SGSI"),
        ("¿Al planificar un cambio se evalúan sus consecuencias, recursos y responsables?", "Solicitudes de cambio con análisis de impacto"),
        ("¿Los cambios realizados quedan registrados y se revisa que se hayan implementado como se planificó?", "Historial de cambios con verificación posterior"),
    ],
    # ------------------------------------------------------------------ Cláusula 7
    "7.1": [
        ("¿Se determinaron los recursos necesarios para operar y mejorar el sistema de gestión (personas, presupuesto, herramientas)?", "Plan de recursos o presupuesto del SGSI"),
        ("¿Los recursos comprometidos están efectivamente disponibles?", "Asignaciones de personal y contratos o licencias vigentes"),
        ("¿Se revisa si los recursos siguen siendo suficientes, por ejemplo en la revisión por la dirección?", "Acta de revisión por la dirección que trate los recursos"),
    ],
    "7.2": [
        ("¿Están definidas las competencias necesarias para cada rol con responsabilidades de seguridad?", "Perfiles de cargo con competencias de seguridad"),
        ("¿Se verifica que las personas tengan esas competencias por formación, experiencia o certificación?", "Certificados, currículums o evaluaciones de competencias"),
        ("¿Se toman acciones cuando falta una competencia (capacitación, contratación) y se evalúa su efectividad?", "Plan de capacitación y registros de evaluación posterior"),
    ],
    "7.3": [
        ("¿El personal conoce la política de seguridad y cómo su trabajo contribuye a la seguridad de la información?", "Material de inducción y registros de asistencia"),
        ("¿El personal sabe cuáles son las consecuencias de no cumplir las normas de seguridad?", "Política o reglamento interno con consecuencias comunicadas"),
        ("¿Se mide el nivel de concientización del personal, por ejemplo con encuestas o simulacros de phishing?", "Resultados de encuestas, pruebas o simulacros"),
    ],
    "7.4": [
        ("¿Está definido qué se comunica sobre seguridad, a quién, cuándo, cómo y quién lo hace, tanto interna como externamente?", "Plan de comunicaciones del SGSI"),
        ("¿Las comunicaciones planificadas efectivamente se realizan?", "Registros de comunicaciones enviadas"),
        ("¿Existe un canal para comunicar incidentes y requisitos a autoridades y clientes cuando corresponde?", "Procedimiento de comunicación externa y contactos definidos"),
    ],
    "7.5": [
        ("¿Existe un procedimiento de control de documentos que defina creación, aprobación, versiones y distribución?", "Procedimiento de control documental"),
        ("¿Los documentos del sistema de gestión tienen identificación, versión, fecha y aprobador?", "Muestra de documentos con control de versiones"),
        ("¿Los registros se conservan protegidos contra pérdida o alteración, con plazos de retención definidos?", "Tabla de retención y repositorio con control de acceso"),
    ],
    # ------------------------------------------------------------------ Cláusula 8
    "8.1": [
        ("¿Los procesos necesarios para cumplir los requisitos de seguridad se planifican y controlan con criterios definidos?", "Procedimientos operativos con criterios de control"),
        ("¿Los procesos o servicios contratados a terceros que afectan la seguridad están identificados y controlados?", "Listado de procesos externalizados y sus controles"),
        ("¿Se conserva evidencia de que los procesos se ejecutaron según lo planificado?", "Registros operativos y bitácoras"),
    ],
    "8.2": [
        ("¿Las evaluaciones de riesgos se realizan en los intervalos planificados?", "Calendario de evaluaciones de riesgo"),
        ("¿Se hace una nueva evaluación cuando ocurren cambios significativos o incidentes graves?", "Evaluaciones de riesgo posteriores a cambios o incidentes"),
        ("¿Los resultados de cada evaluación de riesgos quedan documentados y fechados?", "Informes de evaluación de riesgos"),
    ],
    "8.3": [
        ("¿El plan de tratamiento de riesgos se está ejecutando según lo comprometido?", "Seguimiento del plan de tratamiento con estado de cada acción"),
        ("¿Las acciones de tratamiento tienen responsable y fecha, y se registran como cerradas al terminar?", "Registro de acciones de tratamiento cerradas"),
        ("¿Se verifica que las acciones aplicadas redujeron el riesgo como se esperaba?", "Reevaluación del riesgo residual"),
    ],
    # ------------------------------------------------------------------ Cláusula 9
    "9.1": [
        ("¿Está definido qué se mide del sistema de gestión, cómo, cuándo y quién analiza los resultados?", "Plan de medición e indicadores"),
        ("¿Los indicadores se miden efectivamente y quedan registrados?", "Tablero o reporte de indicadores con datos históricos"),
        ("¿Los resultados se analizan y se usan para tomar decisiones o acciones de mejora?", "Actas o reportes con análisis de indicadores"),
    ],
    "9.2": [
        ("¿Existe un programa de auditorías internas que cubra todo el alcance del sistema de gestión en un periodo definido?", "Programa anual de auditoría interna"),
        ("¿Los auditores internos son independientes del área que auditan?", "Designación de auditores y listado de áreas auditadas por cada uno"),
        ("¿Los resultados de las auditorías se informan a la dirección y los hallazgos generan acciones correctivas?", "Informes de auditoría y registro de hallazgos"),
    ],
    "9.3": [
        ("¿La alta dirección revisa el sistema de gestión a intervalos planificados?", "Actas de revisión por la dirección"),
        ("¿La revisión considera los resultados de auditorías, indicadores, incidentes, riesgos y cambios del contexto?", "Agenda o acta con esos temas"),
        ("¿La revisión termina en decisiones concretas sobre mejoras, recursos o cambios?", "Acuerdos y acciones derivadas de la revisión"),
    ],
    # ------------------------------------------------------------------ Cláusula 10
    "10.1": [
        ("¿La organización identifica oportunidades de mejora del sistema de gestión?", "Registro de oportunidades de mejora"),
        ("¿Las mejoras identificadas se planifican e implementan?", "Plan de mejora con estado de avance"),
        ("¿Hay evidencia de que el sistema de gestión mejoró en el tiempo, por ejemplo en indicadores o en menos incidentes?", "Comparación de indicadores entre periodos"),
    ],
    "10.2": [
        ("¿Existe un procedimiento para registrar no conformidades y tomar acciones correctivas?", "Procedimiento de no conformidades y acciones correctivas"),
        ("¿Para cada no conformidad se analiza la causa raíz antes de definir la acción correctiva?", "Registros de no conformidad con análisis de causa"),
        ("¿Se verifica que las acciones correctivas fueron eficaces y que el problema no se repite?", "Seguimiento y cierre verificado de acciones correctivas"),
    ],
    # ------------------------------------------------------------------ A.5 Organizacionales
    "A.5.1": [
        ("¿Existen políticas específicas por tema (control de acceso, respaldos, uso aceptable, etc.) además de la política general?", "Conjunto de políticas temáticas aprobadas"),
        ("¿Las políticas fueron aprobadas por la dirección y comunicadas a quienes deben cumplirlas?", "Firmas de aprobación y registros de difusión"),
        ("¿Las políticas se revisan a intervalos definidos o cuando hay cambios importantes?", "Historial de revisiones de las políticas"),
    ],
    "A.5.2": [
        ("¿Están definidas las responsabilidades de seguridad de la información para cada rol relevante?", "Matriz de roles y responsabilidades de seguridad"),
        ("¿Los responsables de proteger cada activo o proceso están identificados por nombre o cargo?", "Asignaciones formales de responsables"),
        ("¿Las responsabilidades se actualizan cuando cambia la estructura de la organización?", "Versiones de la matriz de responsabilidades"),
    ],
    "A.5.3": [
        ("¿Se identificaron las funciones que no deben estar en una misma persona, como solicitar y aprobar un pago o desarrollar y desplegar a producción?", "Matriz de funciones incompatibles"),
        ("¿Los permisos de los sistemas impiden que una persona tenga funciones incompatibles?", "Configuración de perfiles o revisión de permisos"),
        ("¿Cuando no es posible separar funciones, existen controles compensatorios como supervisión o revisión de registros?", "Descripción de controles compensatorios y su evidencia"),
    ],
    "A.5.4": [
        ("¿Las jefaturas exigen a su personal que cumpla las políticas y procedimientos de seguridad?", "Objetivos de jefaturas o instrucciones escritas"),
        ("¿Las jefaturas verifican que su equipo haya recibido y entendido las políticas de seguridad?", "Registros de difusión por área"),
        ("¿El cumplimiento de la seguridad se considera en el seguimiento del desempeño del personal?", "Evaluaciones de desempeño con criterios de seguridad"),
    ],
    "A.5.5": [
        ("¿Existe una lista actualizada de contactos de autoridades relevantes, como la Agencia de Protección de Datos Personales, el CSIRT y la policía?", "Directorio de contactos con autoridades"),
        ("¿Está definido quién contacta a cada autoridad y en qué situaciones, por ejemplo ante una vulneración de datos?", "Procedimiento de contacto con autoridades"),
        ("¿La lista de contactos se revisa periódicamente para confirmar que sigue vigente?", "Fecha de última revisión del directorio"),
    ],
    "A.5.6": [
        ("¿La organización participa en grupos, foros o asociaciones de seguridad para mantenerse informada?", "Membresías o registros de participación"),
        ("¿Se reciben alertas de seguridad de fuentes especializadas, como fabricantes o el CSIRT?", "Suscripciones a boletines o alertas"),
        ("¿La información obtenida de estos grupos se usa para mejorar los controles?", "Acciones derivadas de alertas recibidas"),
    ],
    "A.5.7": [
        ("¿La organización recopila información sobre amenazas relevantes para su sector y sus tecnologías?", "Fuentes de inteligencia de amenazas definidas"),
        ("¿Esa información se analiza para determinar si afecta a los sistemas de la organización?", "Informes de análisis de amenazas"),
        ("¿El análisis de amenazas lleva a acciones concretas, como parches, bloqueos o ajustes de reglas?", "Registro de acciones tomadas a partir de amenazas detectadas"),
    ],
    "A.5.8": [
        ("¿Los proyectos de la organización incluyen requisitos de seguridad de la información desde su inicio?", "Metodología de proyectos con etapa de seguridad"),
        ("¿Se evalúan los riesgos de seguridad de cada proyecto antes de su puesta en marcha?", "Evaluaciones de riesgo por proyecto"),
        ("¿Se verifica al cierre del proyecto que los requisitos de seguridad se cumplieron?", "Actas de cierre con validación de seguridad"),
    ],
    "A.5.9": [
        ("¿Existe un inventario de activos de información (sistemas, bases de datos, equipos, documentos) con un responsable para cada uno?", "Inventario de activos con dueño asignado"),
        ("¿El inventario indica la ubicación y la importancia de cada activo?", "Campos de ubicación y criticidad en el inventario"),
        ("¿El inventario se actualiza cuando se incorporan o dan de baja activos?", "Historial de altas y bajas del inventario"),
    ],
    "A.5.10": [
        ("¿Existen reglas de uso aceptable de la información y los equipos de la organización?", "Política de uso aceptable"),
        ("¿El personal y los terceros con acceso aceptaron formalmente esas reglas?", "Acuses de recibo o firmas de aceptación"),
        ("¿Se revisa o monitorea el cumplimiento de las reglas de uso aceptable?", "Registros de revisión o de incumplimientos detectados"),
    ],
    "A.5.11": [
        ("¿Existe un procedimiento para recuperar equipos, credenciales y documentos cuando una persona deja la organización o termina un contrato?", "Procedimiento de devolución de activos"),
        ("¿Se registra la devolución de los activos entregados a cada persona?", "Actas de devolución firmadas"),
        ("¿Se verifica que la información de la organización fue eliminada de los equipos personales del trabajador saliente?", "Lista de verificación de salida completada"),
    ],
    "A.5.12": [
        ("¿Existe un esquema de clasificación de la información, por ejemplo pública, interna, confidencial y restringida?", "Política de clasificación de la información"),
        ("¿La clasificación considera los requisitos legales, como los datos personales y sensibles de la Ley 21.719?", "Criterios de clasificación con referencia a datos personales"),
        ("¿Se clasificaron efectivamente los principales activos de información?", "Inventario de activos con su clasificación"),
    ],
    "A.5.13": [
        ("¿Existen reglas para etiquetar la información según su clasificación, en documentos y sistemas?", "Procedimiento de etiquetado"),
        ("¿Los documentos y correos confidenciales muestran efectivamente su etiqueta?", "Muestra de documentos etiquetados"),
        ("¿El personal sabe cómo etiquetar y cómo tratar la información según su etiqueta?", "Material de capacitación sobre etiquetado"),
    ],
    "A.5.14": [
        ("¿Existen reglas para transferir información de forma segura por correo, medios extraíbles o servicios en la nube?", "Política de transferencia de información"),
        ("¿Las transferencias de información confidencial usan cifrado o canales seguros?", "Configuración de cifrado o evidencia de canales seguros"),
        ("¿Existen acuerdos con terceros que regulen la información que se intercambia con ellos?", "Acuerdos o cláusulas de intercambio de información"),
    ],
    "A.5.15": [
        ("¿Existe una política de control de acceso basada en la necesidad de conocer y el mínimo privilegio?", "Política de control de acceso"),
        ("¿Los accesos a sistemas e información se otorgan según el rol de cada persona?", "Matriz de perfiles por rol"),
        ("¿La política de control de acceso se revisa cuando cambian los sistemas o los riesgos?", "Historial de revisiones de la política"),
    ],
    "A.5.16": [
        ("¿Cada usuario tiene una identidad única, sin cuentas compartidas, salvo excepciones justificadas?", "Listado de cuentas con titular"),
        ("¿Existe un procedimiento para crear, modificar y eliminar identidades de usuarios?", "Procedimiento de gestión de identidades"),
        ("¿Se detectan y eliminan las cuentas inactivas o de personas que ya no trabajan en la organización?", "Reporte de cuentas inactivas y bajas realizadas"),
    ],
    "A.5.17": [
        ("¿Existen reglas sobre las contraseñas y otros medios de autenticación, como su largo, complejidad y prohibición de compartirlas?", "Política de contraseñas y autenticación"),
        ("¿Las contraseñas iniciales se entregan de forma segura y se obliga a cambiarlas en el primer ingreso?", "Procedimiento de entrega de credenciales"),
        ("¿Los sistemas guardan las contraseñas de forma protegida, por ejemplo con hash, y no en texto plano?", "Configuración técnica del almacenamiento de credenciales"),
    ],
    "A.5.18": [
        ("¿Los accesos se otorgan con una solicitud aprobada por el responsable del sistema o de la información?", "Solicitudes de acceso aprobadas"),
        ("¿Los accesos se ajustan o revocan cuando una persona cambia de cargo o deja la organización?", "Registros de modificación y revocación de accesos"),
        ("¿Se revisan periódicamente los accesos de cada sistema para confirmar que siguen siendo necesarios?", "Informes de revisión de accesos con fecha"),
    ],
    "A.5.19": [
        ("¿Existe un procedimiento para evaluar los riesgos de seguridad antes de contratar a un proveedor?", "Procedimiento de evaluación de proveedores"),
        ("¿Están identificados los proveedores que acceden a información o sistemas de la organización?", "Listado de proveedores críticos"),
        ("¿Se reevalúa periódicamente la seguridad de los proveedores críticos?", "Evaluaciones periódicas de proveedores"),
    ],
    "A.5.20": [
        ("¿Los contratos con proveedores incluyen cláusulas de seguridad y confidencialidad?", "Contratos con cláusulas de seguridad"),
        ("¿Los contratos con proveedores que tratan datos personales definen sus obligaciones como encargados del tratamiento?", "Cláusulas de tratamiento de datos personales"),
        ("¿Los contratos establecen el derecho a auditar al proveedor y la obligación de avisar incidentes?", "Cláusulas de auditoría y notificación de incidentes"),
    ],
    "A.5.21": [
        ("¿Se gestionan los riesgos de los proveedores de tecnología, como software, nube y equipos?", "Evaluación de riesgos de la cadena de suministro TIC"),
        ("¿Se exige a los proveedores de tecnología que informen vulnerabilidades y entreguen actualizaciones de seguridad?", "Acuerdos de soporte y actualizaciones"),
        ("¿Se verifica el origen y la integridad del software y los equipos adquiridos?", "Registros de verificación de compras tecnológicas"),
    ],
    "A.5.22": [
        ("¿Se monitorea que los proveedores cumplan los requisitos de seguridad acordados?", "Informes de seguimiento de proveedores"),
        ("¿Los cambios en los servicios de un proveedor se evalúan antes de aceptarlos?", "Registro de cambios de proveedores evaluados"),
        ("¿Los incumplimientos de un proveedor generan acciones o sanciones documentadas?", "Registro de incumplimientos y acciones"),
    ],
    "A.5.23": [
        ("¿Existen criterios de seguridad para contratar, usar y dejar servicios en la nube?", "Política de uso de servicios en la nube"),
        ("¿Están definidas las responsabilidades de seguridad entre la organización y el proveedor de nube?", "Modelo de responsabilidad compartida documentado"),
        ("¿Existe un plan para salir de un servicio en la nube recuperando y eliminando la información?", "Plan de salida del proveedor de nube"),
    ],
    "A.5.24": [
        ("¿Existe un procedimiento de gestión de incidentes de seguridad con roles y etapas definidas?", "Procedimiento de gestión de incidentes"),
        ("¿Están definidos los criterios para clasificar la gravedad de un incidente?", "Criterios de clasificación de incidentes"),
        ("¿El procedimiento se prueba, por ejemplo con simulacros o ejercicios?", "Registros de simulacros de incidentes"),
    ],
    "A.5.25": [
        ("¿Los eventos de seguridad reportados se evalúan para decidir si son incidentes?", "Registro de eventos evaluados"),
        ("¿La decisión sobre cada evento queda documentada con su justificación?", "Fichas de evaluación de eventos"),
        ("¿Quienes evalúan los eventos tienen los criterios y la capacitación necesarios?", "Criterios de evaluación y capacitación del equipo"),
    ],
    "A.5.26": [
        ("¿Los incidentes se atienden siguiendo el procedimiento definido, con contención, erradicación y recuperación?", "Registros de incidentes atendidos"),
        ("¿Cada incidente tiene un responsable y queda registrado con sus acciones y fechas?", "Bitácora de incidentes"),
        ("¿Se notifica a las autoridades y afectados cuando la ley lo exige, como en una vulneración de datos personales?", "Registros de notificaciones realizadas"),
    ],
    "A.5.27": [
        ("¿Después de un incidente se analiza su causa raíz?", "Informes posteriores a incidentes"),
        ("¿Las lecciones aprendidas se convierten en mejoras de controles o procedimientos?", "Acciones de mejora derivadas de incidentes"),
        ("¿Se revisan las tendencias de incidentes para detectar problemas que se repiten?", "Análisis de tendencias de incidentes"),
    ],
    "A.5.28": [
        ("¿Existe un procedimiento para recolectar y preservar evidencia de un incidente sin alterarla?", "Procedimiento de manejo de evidencia"),
        ("¿Se registra quién manipuló la evidencia y cuándo (cadena de custodia)?", "Formularios de cadena de custodia"),
        ("¿El personal que recolecta evidencia sabe cómo hacerlo correctamente?", "Capacitación en recolección de evidencia"),
    ],
    "A.5.29": [
        ("¿Están definidos los requisitos para mantener la seguridad de la información durante una interrupción o crisis?", "Plan de continuidad con requisitos de seguridad"),
        ("¿Los controles de seguridad siguen aplicándose cuando se activan los planes de contingencia?", "Procedimientos de contingencia con controles de seguridad"),
        ("¿Se prueban los planes de contingencia incluyendo los aspectos de seguridad?", "Informes de pruebas de contingencia"),
    ],
    "A.5.30": [
        ("¿Se analizó qué servicios de tecnología son críticos y cuánto tiempo pueden estar detenidos?", "Análisis de impacto en el negocio con tiempos de recuperación"),
        ("¿Existen planes para recuperar los servicios de tecnología críticos dentro de esos tiempos?", "Planes de recuperación ante desastres"),
        ("¿Los planes de recuperación se prueban periódicamente y se corrigen las fallas encontradas?", "Informes de pruebas de recuperación"),
    ],
    "A.5.31": [
        ("¿Existe un registro actualizado de las leyes, regulaciones y contratos que aplican a la seguridad de la información, incluida la Ley 21.719?", "Registro de requisitos legales y contractuales"),
        ("¿Están asignados responsables de cumplir cada requisito legal?", "Matriz de cumplimiento legal con responsables"),
        ("¿Se revisa periódicamente el cumplimiento de esos requisitos y se actualiza el registro ante cambios legales?", "Evaluaciones de cumplimiento legal"),
    ],
    "A.5.32": [
        ("¿Se protege la propiedad intelectual, por ejemplo usando solo software con licencia?", "Inventario de licencias de software"),
        ("¿Existe una política que prohíba instalar software sin licencia o no autorizado?", "Política de software autorizado"),
        ("¿Se revisa periódicamente que el software instalado tenga licencia vigente?", "Auditorías de licenciamiento"),
    ],
    "A.5.33": [
        ("¿Están definidos los plazos de conservación de los registros importantes, como contables, laborales y de seguridad?", "Tabla de retención de registros"),
        ("¿Los registros se protegen contra pérdida, alteración y acceso no autorizado?", "Controles de acceso y respaldo de los registros"),
        ("¿Los registros se eliminan de forma segura al cumplirse su plazo de conservación?", "Actas de eliminación de registros"),
    ],
    "A.5.34": [
        ("¿Se identificaron los datos personales que trata la organización y los requisitos de la Ley 21.719 que les aplican?", "Inventario de datos personales y análisis legal"),
        ("¿Existen controles específicos para proteger los datos personales, como acceso restringido y cifrado?", "Controles de protección de datos personales"),
        ("¿Existe un responsable de privacidad o delegado de protección de datos cuando corresponde?", "Designación del delegado o responsable de privacidad"),
    ],
    "A.5.35": [
        ("¿La seguridad de la información se revisa de forma independiente a intervalos planificados, por auditoría interna o externa?", "Informes de revisiones independientes"),
        ("¿La revisión la realizan personas que no son responsables del área revisada?", "Evidencia de independencia de los revisores"),
        ("¿Los resultados de la revisión independiente se informan a la dirección y generan acciones?", "Plan de acción derivado de la revisión"),
    ],
    "A.5.36": [
        ("¿Las jefaturas revisan periódicamente que su área cumpla las políticas y normas de seguridad?", "Revisiones de cumplimiento por área"),
        ("¿Se revisan técnicamente los sistemas para confirmar que su configuración cumple las normas internas?", "Informes de revisión de configuraciones"),
        ("¿Los incumplimientos detectados se corrigen y se registra su cierre?", "Registro de incumplimientos y correcciones"),
    ],
    "A.5.37": [
        ("¿Las tareas operativas importantes, como respaldos o altas de usuarios, tienen procedimientos documentados?", "Procedimientos operativos documentados"),
        ("¿Los procedimientos están disponibles para quienes los necesitan?", "Repositorio de procedimientos con control de acceso"),
        ("¿Los procedimientos se actualizan cuando cambian los sistemas o las tareas?", "Historial de versiones de los procedimientos"),
    ],
    # ------------------------------------------------------------------ A.6 Personas
    "A.6.1": [
        ("¿Se verifican los antecedentes de los candidatos antes de contratarlos, de forma proporcional al cargo?", "Procedimiento de verificación de antecedentes"),
        ("¿La verificación de antecedentes respeta la legislación laboral y de protección de datos?", "Consentimientos o base legal de la verificación"),
        ("¿Se conserva evidencia de las verificaciones realizadas?", "Registros de verificación por trabajador"),
    ],
    "A.6.2": [
        ("¿Los contratos de trabajo incluyen las responsabilidades de seguridad de la información?", "Contratos con cláusulas de seguridad"),
        ("¿Los contratos indican las responsabilidades que se mantienen después de terminar la relación laboral?", "Cláusulas de obligaciones posteriores al término"),
        ("¿Los trabajadores firman el contrato con esas cláusulas antes de acceder a la información?", "Contratos firmados con fecha"),
    ],
    "A.6.3": [
        ("¿Existe un programa de capacitación en seguridad de la información para todo el personal?", "Plan anual de capacitación en seguridad"),
        ("¿El personal nuevo recibe capacitación en seguridad durante su inducción?", "Registros de inducción"),
        ("¿Se evalúa la efectividad de la capacitación, por ejemplo con pruebas o simulacros de phishing?", "Resultados de evaluaciones y simulacros"),
    ],
    "A.6.4": [
        ("¿Existe un proceso disciplinario formal para las infracciones a la seguridad de la información?", "Reglamento interno con proceso disciplinario"),
        ("¿El personal conoce el proceso disciplinario?", "Registro de difusión del reglamento"),
        ("¿El proceso se aplica de forma consistente cuando hay infracciones?", "Registros de casos tratados"),
    ],
    "A.6.5": [
        ("¿Están definidas las responsabilidades de seguridad que siguen vigentes después de que una persona deja la organización o cambia de cargo?", "Cláusulas de confidencialidad posteriores"),
        ("¿Se recuerdan esas responsabilidades al momento del término o cambio de cargo?", "Lista de verificación de salida firmada"),
        ("¿Se revocan los accesos de forma oportuna cuando una persona deja la organización?", "Registros de revocación con fecha de salida"),
    ],
    "A.6.6": [
        ("¿Existen acuerdos de confidencialidad firmados por trabajadores, proveedores y terceros con acceso a información sensible?", "Acuerdos de confidencialidad firmados"),
        ("¿Los acuerdos de confidencialidad definen qué información protegen y por cuánto tiempo?", "Texto de los acuerdos"),
        ("¿Los acuerdos de confidencialidad se revisan cuando cambian los requisitos?", "Historial de revisiones de los modelos de acuerdo"),
    ],
    "A.6.7": [
        ("¿Existe una política de teletrabajo con requisitos de seguridad, como conexión segura y uso de equipos?", "Política de teletrabajo"),
        ("¿Las conexiones remotas usan mecanismos seguros, como VPN y autenticación de dos factores?", "Configuración de acceso remoto"),
        ("¿El personal en teletrabajo recibió instrucciones de seguridad para su lugar de trabajo?", "Registro de capacitación o acuse de la política"),
    ],
    "A.6.8": [
        ("¿Existe un canal claro para que el personal informe eventos de seguridad, como correos sospechosos o pérdida de equipos?", "Procedimiento y canal de reporte"),
        ("¿El personal sabe cómo y a quién reportar un evento de seguridad?", "Material de difusión y capacitación"),
        ("¿Los reportes recibidos quedan registrados y se les da seguimiento?", "Registro de eventos reportados"),
    ],
    # ------------------------------------------------------------------ A.7 Físicos
    "A.7.1": [
        ("¿Están definidas las áreas seguras, como la sala de servidores, y sus perímetros físicos?", "Plano de áreas seguras"),
        ("¿Los perímetros cuentan con barreras físicas adecuadas, como muros, puertas con cerradura y control de acceso?", "Fotografías o inspección de perímetros"),
        ("¿Se revisa periódicamente el estado de los perímetros de seguridad?", "Registros de inspección física"),
    ],
    "A.7.2": [
        ("¿El acceso a las áreas seguras está restringido a personas autorizadas, con tarjeta, clave o biometría?", "Sistema de control de acceso físico"),
        ("¿Se registran las entradas y salidas, incluidas las de visitas?", "Registro de accesos y de visitas"),
        ("¿Se revisan periódicamente las autorizaciones de acceso físico?", "Revisiones de la lista de personas autorizadas"),
    ],
    "A.7.3": [
        ("¿Las oficinas e instalaciones que manejan información sensible están protegidas contra el acceso no autorizado?", "Medidas de seguridad de oficinas"),
        ("¿La ubicación de las instalaciones sensibles es discreta y no se publica innecesariamente?", "Criterios de señalización y ubicación"),
        ("¿Se revisa la seguridad física de las oficinas periódicamente?", "Informes de inspección"),
    ],
    "A.7.4": [
        ("¿Las instalaciones cuentan con monitoreo, como cámaras o alarmas, en las áreas sensibles?", "Sistema de videovigilancia o alarmas"),
        ("¿Las grabaciones o alertas se revisan y se conservan por un plazo definido?", "Procedimiento de revisión y retención de grabaciones"),
        ("¿El monitoreo de las personas respeta la normativa de protección de datos, como avisos de videovigilancia?", "Avisos de videovigilancia y política aplicable"),
    ],
    "A.7.5": [
        ("¿Se evaluaron las amenazas físicas y ambientales, como incendio, inundación, sismo y cortes de energía?", "Evaluación de riesgos físicos y ambientales"),
        ("¿Existen protecciones como detectores de humo, extintores y respaldo de energía?", "Inventario y mantenimiento de equipos de protección"),
        ("¿Las protecciones se prueban o mantienen periódicamente?", "Registros de mantenimiento y pruebas"),
    ],
    "A.7.6": [
        ("¿Existen reglas para trabajar en áreas seguras, como prohibir fotografías o el ingreso sin acompañante?", "Normas de trabajo en áreas seguras"),
        ("¿Las personas que trabajan en áreas seguras conocen esas reglas?", "Registros de difusión"),
        ("¿Se supervisa el trabajo de terceros dentro de las áreas seguras?", "Registros de supervisión de visitas técnicas"),
    ],
    "A.7.7": [
        ("¿Existe una política de escritorio y pantalla limpios?", "Política de escritorio y pantalla limpios"),
        ("¿Los equipos se bloquean automáticamente tras un tiempo sin uso?", "Configuración de bloqueo automático"),
        ("¿Se verifica el cumplimiento, por ejemplo con revisiones al final de la jornada?", "Registros de revisiones de escritorio limpio"),
    ],
    "A.7.8": [
        ("¿Los equipos críticos están ubicados en lugares protegidos contra daños y accesos no autorizados?", "Ubicación documentada de equipos críticos"),
        ("¿Los equipos están protegidos contra riesgos ambientales, como polvo, humedad y temperatura?", "Condiciones ambientales controladas"),
        ("¿Se revisa periódicamente la ubicación y protección de los equipos?", "Registros de inspección"),
    ],
    "A.7.9": [
        ("¿Existen reglas para proteger los equipos que se usan fuera de las instalaciones, como notebooks?", "Política de uso de equipos fuera de la oficina"),
        ("¿Los equipos que salen de la organización tienen cifrado y protección contra robo?", "Configuración de cifrado de equipos portátiles"),
        ("¿Se registra qué equipos están fuera de las instalaciones y quién los tiene?", "Registro de equipos asignados"),
    ],
    "A.7.10": [
        ("¿Existen reglas para el uso, transporte y almacenamiento de medios extraíbles, como pendrives y discos?", "Política de medios de almacenamiento"),
        ("¿Los medios con información confidencial están cifrados?", "Configuración de cifrado de medios"),
        ("¿Los medios se eliminan o destruyen de forma segura cuando ya no se usan?", "Actas de destrucción de medios"),
    ],
    "A.7.11": [
        ("¿Los equipos críticos tienen protección contra fallas de suministro, como UPS o generador?", "Inventario de UPS y generadores"),
        ("¿Los servicios de apoyo (energía, climatización, telecomunicaciones) tienen mantenimiento definido?", "Plan de mantenimiento de servicios de apoyo"),
        ("¿Se prueban periódicamente los sistemas de respaldo de energía?", "Registros de pruebas de UPS o generador"),
    ],
    "A.7.12": [
        ("¿El cableado de energía y datos está protegido contra daños e interceptación?", "Inspección del cableado"),
        ("¿El cableado de energía está separado del cableado de datos para evitar interferencias?", "Planos o fotografías de canalizaciones"),
        ("¿Los gabinetes y puntos de conexión están cerrados y con acceso restringido?", "Inspección de gabinetes"),
    ],
    "A.7.13": [
        ("¿Existe un plan de mantenimiento de los equipos según las recomendaciones del fabricante?", "Plan de mantenimiento de equipos"),
        ("¿El mantenimiento lo realiza personal autorizado y queda registrado?", "Registros de mantenimiento"),
        ("¿Se protege la información de los equipos que salen a reparación externa?", "Procedimiento para equipos enviados a reparación"),
    ],
    "A.7.14": [
        ("¿Existe un procedimiento para borrar de forma segura la información antes de reutilizar o desechar un equipo?", "Procedimiento de borrado seguro"),
        ("¿El borrado o la destrucción de los medios queda registrado con evidencia?", "Certificados o actas de borrado y destrucción"),
        ("¿Se verifica que no quede información recuperable en los equipos dados de baja?", "Verificaciones posteriores al borrado"),
    ],
}
