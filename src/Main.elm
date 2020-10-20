port module Main exposing (..)
import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)


-- TODO backing up sites, *, other features

main =
  Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }

-- PORTS


port setBrowserStorage : Model -> Cmd msg
port getBrowserStorage : (String -> msg) -> Sub msg
port listTabs : (List Tab -> msg) -> Sub msg
port purgeTabs : List Int -> Cmd msg

subscriptions : Model -> Sub Msg
subscriptions _ = Sub.batch [getBrowserStorage GetBrowserStorage, listTabs ListTabs]

-- filterTabs tabs = TODO move function from ports.js to here

-- MODEL

type alias Tab = {id : Int, url : String, title : String}

type alias Model = {
    tab_list : List Tab,
    site_list : String
  }

init : () -> (Model, Cmd Msg)
init flags = ({
    tab_list = [],
    site_list = ""
    }, 
    Cmd.none)

-- UPDATE

type Msg = SetSiteList String
    | SetBrowserStorage | GetBrowserStorage String | ListTabs (List Tab) | PurgeTabs

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    -- we return model and command so it's consistent, because some messages do commands and other messages update model
    case msg of
        SetSiteList new_site_list ->
            ({model | site_list = new_site_list}, Cmd.none)
        SetBrowserStorage -> 
            (model, setBrowserStorage model)
        GetBrowserStorage message -> 
            ({model | site_list = message}, Cmd.none)
        ListTabs message ->
            ({model | tab_list = message}, Cmd.none)
        PurgeTabs ->
            (model, purgeTabs (List.map (\x -> x.id) model.tab_list))

-- VIEW

tabToRow tab = 
    tr [] [
        td [] [text tab.title],
        td [] [text tab.url]
    ]

view model =
    div [] [
        button [class "purge", onClick PurgeTabs] [text "Purge"],
        div [id "to-purge"] [
            p [id "no-tabs-to-purge", style "display" (if List.isEmpty model.tab_list then "block" else "none")] [text "No tabs to purge!"],
            table [] [
                tbody [id "tabs-to-remove"] (
                    List.map tabToRow model.tab_list
                )
            ]
        ],
        b [] [text "Sites to remove"],
        br [] [],
        textarea [id "sites-to-remove", onInput SetSiteList] [text model.site_list],
        br [] [],
        button [class "save", onClick SetBrowserStorage] [text "Save"]
    ]