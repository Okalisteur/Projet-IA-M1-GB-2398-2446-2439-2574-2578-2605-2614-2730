% -------- Serveur Web pour l'enquête policière --------
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_cors)).

% Inclure le fichier de base de données d'enquête
:- include('enquete_database.pl').

% Configuration CORS pour permettre les requêtes depuis le frontend
:- set_setting(http:cors, [*]).

% Routes HTTP
:- http_handler('/api/investigate',    handle_investigate,   []).
:- http_handler('/api/persons',        handle_persons,       []).
:- http_handler('/api/evidence',       handle_evidence,      []).
:- http_handler('/api/full-analysis',  handle_full_analysis, []).
:- http_handler('/api/innocence',      handle_innocence,     []).
:- http_handler('/api/alibis',         handle_alibis,        []).
:- http_handler('/api/contradictions', handle_contradictions,[]).

% ---------- Démarre / Arrête ----------
start_server(Port) :-
    http_server(http_dispatch, [port(Port)]),
    format('🚀 Serveur Prolog démarré sur le port ~w~n', [Port]),
    format('🌐 API: http://localhost:~w/api/~n', [Port]),
    format('📊 Test: http://localhost:~w/api/persons~n', [Port]).

stop_server :-
    http_stop_server(3000, []),
    format('🛑 Serveur arrêté~n').

% ---------- /api/investigate ----------
handle_investigate(Request) :-
    cors_enable(Request, [methods([get, post, options])]),
    (   option(method(options), Request)
    ->  true
    ;   http_parameters(Request, [
            person(Person, [atom]),
            crime(Crime,   [atom])
        ]),
        (   final_status(Person, Crime, Status) -> true ; Status = unknown ),
        findall(Ev, get_evidence_for_person(Person, Crime, Ev), EvidenceList),
        Resp = _{
            person:    Person,
            crime:     Crime,
            status:    Status,
            evidence:  EvidenceList,
            timestamp: "prolog_response"
        },
        reply_json_dict(Resp)
    ).

% ---------- /api/persons ----------
handle_persons(Request) :-
    cors_enable(Request, [methods([get, options])]),
    (   option(method(options), Request)
    ->  true
    ;   findall(PersonData,
            ( person(P),
              findall(_{crime:C, status:S},
                      ( crime_type(C),
                        ( final_status(P, C, S) -> true ; S = unknown )
                      ),
                      CrimeStatuses),
              PersonData = _{name:P, crimes:CrimeStatuses}
            ),
            PersonsData),
        length(PersonsData, Total),
        Resp = _{
            persons:   PersonsData,
            total:     Total,
            timestamp: "prolog_response"
        },
        reply_json_dict(Resp)
    ).


handle_evidence_debug(Request) :-
    cors_enable(Request, [methods([get, options])]),
    (   option(method(options), Request) -> 
        true
    ;   http_parameters(Request, [
            person(Person, [atom, optional(none)]),
            crime(Crime, [atom, optional(none)]),
            debug(Debug, [atom, optional(false)])
        ]),
        
        % Mode debug activé
        (   Debug = true ->
            format('DEBUG: Person=~w, Crime=~w~n', [Person, Crime])
        ;   true
        ),
        
        (   Person \= none ->
            format('Recherche indices pour personne: ~w~n', [Person]),
            get_all_evidence_for_person(Person, EvidenceList),
            format('Indices trouvés: ~w~n', [EvidenceList])
        ;   Crime \= none ->
            format('Recherche indices pour crime: ~w~n', [Crime]),
            get_all_evidence_for_crime(Crime, EvidenceList),
            format('Indices trouvés: ~w~n', [EvidenceList])
        ;   EvidenceList = []
        ),
        
        length(EvidenceList, Count),
        Response = _{
            evidence: EvidenceList,
            count: Count,
            debug: Debug,
            timestamp: "prolog_response"
        },
        reply_json(Response)
    ).

% ---------- /api/evidence ----------
handle_evidence(Request) :-
    cors_enable(Request, [methods([get, options])]),
    (   option(method(options), Request) -> true     % Réponse CORS preflight
    ;   http_parameters(Request, [
            person(Person, [atom, optional(true), default(none)]),
            crime(Crime,  [atom, optional(true), default(none)])
        ]),
        (   Person \= none ->                         
            get_all_evidence_for_person(Person, EvidenceList)
        ;   Crime \= none ->                          
            get_all_evidence_for_crime(Crime, EvidenceList)
        ;   EvidenceList = []                         
        ),
        length(EvidenceList, Count),
        Response = _{
            evidence: EvidenceList,
            count: Count,
            timestamp: "prolog_response"
        },
        reply_json(Response)
    ).

% ---------- /api/alibis ----------
handle_alibis(Request) :-
    cors_enable(Request, [methods([get, options])]),
    (   option(method(options), Request)
    ->  true
    ;   http_parameters(Request, [
            crime(Crime, [atom, optional(none)])
        ]),
        (   Crime \= none ->
            analyze_alibis(Crime, AlibiAnalysis),
            get_all_alibis(Crime, AlibisData)
        ;   AlibiAnalysis = [],
            AlibisData = []
        ),
        Response = _{
            alibis: AlibisData,
            analysis: AlibiAnalysis,
            timestamp: "prolog_response"
        },
        reply_json(Response)
    ).

% ---------- /api/contradictions ----------
handle_contradictions(Request) :-
    cors_enable(Request, [methods([get, options])]),
    (   option(method(options), Request)
    ->  true
    ;   http_parameters(Request, [
            crime(Crime, [atom, optional(none)])
        ]),
        (   Crime \= none ->
            detect_contradictions(Crime, Contradictions),
            analyze_communications(Crime, Communications),
            analyze_financial_flows(Crime, FinancialFlows)
        ;   Contradictions = [],
            Communications = [],
            FinancialFlows = []
        ),
        Response = _{
            contradictions: Contradictions,
            communications: Communications,
            financial_flows: FinancialFlows,
            timestamp: "prolog_response"
        },
        reply_json(Response)
    ).

% ---------- /api/full-analysis ----------
handle_full_analysis(Request) :-
    cors_enable(Request, [methods([get, options])]),
    (   option(method(options), Request)
    ->  true
    ;   findall(CrimeAnalysis,
            ( crime_type(Crime),
              findall(P, is_guilty(P, Crime), Guilty),
              findall(_{accomplice:P, main_criminal:Main},
                      is_accomplice(P, Main, Crime),
                      Accomplices),
              findall(P,
                      ( person(P), final_status(P, Crime, suspect) ),
                      Suspects),
              findall(P,
                      ( person(P), final_status(P, Crime, innocent) ),
                      Innocents),
              % Ajout des analyses avancées
              complete_evidence_analysis(Crime, CompleteEvidence),
              identify_key_persons(Crime, KeyPersons),
              CrimeAnalysis = _{
                  crime:            Crime,
                  guilty:           Guilty,
                  accomplices:      Accomplices,
                  suspects:         Suspects,
                  innocents:        Innocents,
                  evidence_analysis: CompleteEvidence,
                  key_persons:      KeyPersons
              }
            ),
            CrimesAnalysis),
        Resp = _{
            crimes:        CrimesAnalysis,
            analysis_date: "prolog_computation",
            timestamp:     "prolog_response"
        },
        reply_json_dict(Resp)
    ).

% ---------- /api/innocence ----------
handle_innocence(Request) :-
    cors_enable(Request, [methods([post, options])]),
    (   option(method(options), Request)
    ->  true
    ;   http_read_json_dict(Request, Json),
        Person = Json.person,
        Crime  = Json.crime,
        Resp = _{
            message:   "Person processing completed",
            person:    Person,
            crime:     Crime,
            action:    "innocence_noted",
            timestamp: "prolog_response"
        },
        reply_json_dict(Resp)
    ).

% ---------- Utilitaires Preuves CORRIGÉS ----------

% Pour une personne donnée et un crime donné
get_evidence_for_person(Person, Crime, Evidence) :-
    has_motive(Person, Crime),
    atom_concat('Motif identifié pour ', Crime, Description),
    Evidence = _{type:"motive", description:Description, crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    was_near_crime_scene(Person, Crime),
    Evidence = _{type:"location", description:"Présent près de la scène de crime", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    has_fingerprint_on_weapon(Person, Crime),
    Evidence = _{type:"physical", description:"Empreintes digitales sur l'arme", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    eyewitness_identification(Person, Crime),
    Evidence = _{type:"witness", description:"Identifié par témoin oculaire", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    has_bank_transaction(Person, Crime),
    Evidence = _{type:"financial", description:"Transaction bancaire suspecte", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    owns_fake_identity(Person, Crime),
    Evidence = _{type:"identity", description:"Possession de fausse identité", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    lied_to_police(Person, Crime),
    Evidence = _{type:"deception", description:"Mensonges à la police", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    changed_testimony(Person, Crime),
    Evidence = _{type:"deception", description:"Modification du témoignage", crime:Crime}.

get_evidence_for_person(Person, Crime, Evidence) :-
    helped_plan_crime(Person, MainCriminal, Crime),
    format(atom(Description), 'Aide à la planification avec ~w', [MainCriminal]),
    Evidence = _{type:"accomplice", description:Description, crime:Crime, with:MainCriminal}.

get_evidence_for_person(Person, Crime, Evidence) :-
    provided_alibi(Person, MainCriminal, Crime),
    format(atom(Description), 'Alibi fourni à ~w', [MainCriminal]),
    Evidence = _{type:"accomplice", description:Description, crime:Crime, with:MainCriminal}.

get_evidence_for_person(Person, Crime, Evidence) :-
    phone_contact_before_crime(Person, MainCriminal, Crime),
    format(atom(Description), 'Contact téléphonique avec ~w avant le crime', [MainCriminal]),
    Evidence = _{type:"communication", description:Description, crime:Crime, with:MainCriminal}.

get_evidence_for_person(Person, Crime, Evidence) :-
    money_transfer_after_crime(Person, MainCriminal, Crime),
    format(atom(Description), 'Transfert d\'argent vers ~w après le crime', [MainCriminal]),
    Evidence = _{type:"financial", description:Description, crime:Crime, with:MainCriminal}.

get_evidence_for_person(Person, Crime, Evidence) :-
    hid_evidence(Person, MainCriminal, Crime),
    format(atom(Description), 'Dissimulation de preuves pour ~w', [MainCriminal]),
    Evidence = _{type:"accomplice", description:Description, crime:Crime, with:MainCriminal}.


get_all_evidence_for_person(Person, EvidenceList) :-
    findall(Evidence,
        ( crime_type(Crime),
          get_evidence_for_person(Person, Crime, Evidence)
        ),
        EvidenceList).

% toutes les évidences de tous les suspects pour un crime donné
get_all_evidence_for_crime(Crime, EvidenceList) :-
    findall(_{person:Person, evidence:Evidence},
        ( person(Person),
          get_evidence_for_person(Person, Crime, Evidence)
        ),
        EvidenceList).


% Fonction pour collecter tous les alibis
get_all_alibis(Crime, AlibisData) :-
    findall(_{person:Person, provided_to:ProvidedTo, type:"alibi", crime:Crime},
        provided_alibi(Person, ProvidedTo, Crime),
        AlibisData).

% Fonction pour analyser les alibis croisés
analyze_alibis(Crime, Analysis) :-
    findall(AlibiInfo,
        ( provided_alibi(Person, MainCriminal, Crime),
          ( final_status(Person, Crime, PersonStatus) -> true ; PersonStatus = unknown ),
          ( final_status(MainCriminal, Crime, MainStatus) -> true ; MainStatus = unknown ),
          test_alibi_validity(Person, MainCriminal, Crime, Validity),
          AlibiInfo = _{
              provider: Person,
              provider_status: PersonStatus,
              beneficiary: MainCriminal,
              beneficiary_status: MainStatus,
              crime: Crime,
              validity: Validity
          }
        ),
        Analysis).


test_evidence_system :-
    format('=== TEST DU SYSTÈME D\'INDICES ===~n'),
    
    % Test pour chaque personne
    forall(person(Person), (
        format('--- Indices pour ~w ---~n', [Person]),
        get_all_evidence_for_person(Person, Evidence),
        (   Evidence = [] ->
            format('  Aucun indice trouvé~n')
        ;   forall(member(Ev, Evidence), (
                format('  ~w: ~w (~w)~n', [Ev.type, Ev.description, Ev.crime])
            ))
        ),
        nl
    )),
    
    % Test pour chaque crime
    forall(crime_type(Crime), (
        format('--- Indices pour le crime: ~w ---~n', [Crime]),
        get_all_evidence_for_crime(Crime, CrimeEvidence),
        (   CrimeEvidence = [] ->
            format('  Aucun indice trouvé~n')
        ;   forall(member(Item, CrimeEvidence), (
                format('  ~w: ~w (~w)~n', [Item.person, Item.evidence.description, Item.evidence.type])
            ))
        ),
        nl
    )).

% Fonction pour détecter les contradictions dans les témoignages
detect_contradictions(Crime, Contradictions) :-
    findall(Contradiction,
        ( person(Person),
          ( lied_to_police(Person, Crime) ; changed_testimony(Person, Crime) ),
          Contradiction = _{
              person: Person,
              type: "contradiction",
              description: "Incohérences dans les déclarations",
              crime: Crime
          }
        ),
        Contradictions).

% Fonction pour analyser les réseaux de communication
analyze_communications(Crime, Communications) :-
    findall(CommInfo,
        ( phone_contact_before_crime(Person1, Person2, Crime),
          CommInfo = _{
              from: Person1,
              to: Person2,
              type: "phone_contact",
              timing: "before_crime",
              crime: Crime
          }
        ),
        Communications).

% Fonction pour analyser les flux financiers
analyze_financial_flows(Crime, FinancialFlows) :-
    findall(FlowInfo,
        ( ( has_bank_transaction(Person, Crime) ->
              FlowInfo = _{
                  person: Person,
                  type: "bank_transaction",
                  description: "Transaction bancaire suspecte",
                  crime: Crime
              }
          ; money_transfer_after_crime(Person, Target, Crime) ->
              FlowInfo = _{
                  person: Person,
                  target: Target,
                  type: "money_transfer",
                  timing: "after_crime",
                  crime: Crime
              }
          )
        ),
        FinancialFlows).

complete_evidence_analysis(Crime, CompleteAnalysis) :-
    get_all_evidence_for_crime(Crime, Evidence),
    get_all_alibis(Crime, Alibis),
    analyze_alibis(Crime, AlibiAnalysis),
    detect_contradictions(Crime, Contradictions),
    analyze_communications(Crime, Communications),
    analyze_financial_flows(Crime, FinancialFlows),
    
    CompleteAnalysis = _{
        crime: Crime,
        evidence: Evidence,
        alibis: Alibis,
        alibi_analysis: AlibiAnalysis,
        contradictions: Contradictions,
        communications: Communications,
        financial_flows: FinancialFlows
    }.

% Fonction pour tester la validité des alibis

test_alibi_validity(Person, MainCriminal, Crime, Validity) :-
    provided_alibi(Person, MainCriminal, Crime),
    ( final_status(Person, Crime, PersonStatus) -> true ; PersonStatus = unknown ),
    ( final_status(MainCriminal, Crime, MainStatus) -> true ; MainStatus = unknown ),
    
    ( ( PersonStatus = innocent, MainStatus = coupable ) ->
        Validity = "alibi_suspect" % Innocent qui protège un coupable
    ; ( PersonStatus = complice, MainStatus = coupable ) ->
        Validity = "alibi_complice" % Complice qui protège le coupable principal
    ; ( PersonStatus = suspect ; PersonStatus = complice ) ->
        Validity = "alibi_douteux" % Suspect/complice qui donne un alibi
    ; Validity = "alibi_neutre"
    ).

identify_key_persons(Crime, KeyPersons) :-
    findall(KeyPerson,
        ( person(Person),
          ( final_status(Person, Crime, Status) -> true ; Status = unknown ),
          ( Status = coupable ->
              KeyPerson = _{person:Person, role:"main_criminal", importance:"high"}
          ; Status = complice ->
              KeyPerson = _{person:Person, role:"accomplice", importance:"high"}
          ; ( lied_to_police(Person, Crime) ; changed_testimony(Person, Crime) ) ->
              KeyPerson = _{person:Person, role:"unreliable_witness", importance:"medium"}
          ; provided_alibi(Person, _, Crime) ->
              KeyPerson = _{person:Person, role:"alibi_provider", importance:"medium"}
          ; Status = suspect ->
              KeyPerson = _{person:Person, role:"suspect", importance:"medium"}
          ; fail
          )
        ),
        KeyPersons).

% ---------- Entrées principales ----------
main :-
    format('🔍 SYSTÈME D\'ENQUÊTE POLICIÈRE - SERVEUR PROLOG AMÉLIORÉ~n'),
    format('══════════════════════════════════════════════════════════~n'),
    start_server(3000).

test_system :-
    format('🧪 TEST DU SYSTÈME AMÉLIORÉ~n'),
    forall(person(P),      format('  - Personne: ~w~n', [P])),
    forall(crime_type(C),  format('  - Crime:   ~w~n', [C])),
    final_status(john, vol, S1),    format('John/Vol: ~w~n', [S1]),
    final_status(mary, assassinat, S2), format('Mary/Assassinat: ~w~n', [S2]),
    % Test des nouvelles fonctions
    get_all_evidence_for_person(pierre, EvidenceList),
    format('Preuves Pierre: ~w~n', [EvidenceList]),
    get_all_alibis(assassinat, Alibis),
    format('Alibis Assassinat: ~w~n', [Alibis]),
    format('✅ Test terminé!~n').