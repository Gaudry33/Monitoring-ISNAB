## Supervision Centralisée de l'Infrastructure Réseau
Ce projet consiste à concevoir et déployer un système de supervision et de surveillance en temps réel du SRV1, d'un onduleur et des données environnementales de cette salle informatique. Les données sont collectées à l'ISNAB (Villenave d'Ornon) et centralisées dans les bureaux d'Absyde (Floirac) via une architecture sécurisée incluant le protocole Zabbix.

## Contexte du projet
L'ISNAB, établissement d'enseignement supérieur, s'appuie sur une infrastructure réseau dense (serveurs, onduleurs etc...). Actuellement, l'absence de supervision centralisée freine la réactivité des services techniques face aux incidents.

Pour garantir la continuité de service et la sécurité du réseau, il est nécessaire de collecter et d'analyser les données critiques en temps réel. Ce dispositif permet d'optimiser la maintenance préventive et d'assurer une traçabilité complète des performances. Les objectifs sont les suivants :

* Surveiller les conditions environnementales (température et humidité) de la salle serveur.
* Monitorer l'état de santé du SRV1 (CPU, Disques, Sauvegardes).
* Suivre les données de l'autonomie et la charge de l'onduleur.
* Envoyer des alertes automatiques par Email en cas d'anomalie.

## Composants Clés 

* Microcontrôleur ESP32 & Capteur DHT22
* Serveur de Supervision Zabbix
* Serveur Web Apache 
* Base de données MariaDB 
* Onduleur, SRV1, PCRD

## Technologies Utilisées

* Langages de programmation : C++ , SQL , HTML & CSS & JSS
* Supervision & Visualisation : Zabbix & Site Web
* Gestion de base de données : MariaDB .
* Serveur Web : Apache                                                                                                                                             
* Environnements de développement : Visual Studio Code & Arduino IDE.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

Systèmes d'exploitation : Distribution Debian 12 (Serveur) et Windows 11 (Poste de développement)
                                                                  
