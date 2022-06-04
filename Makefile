
stage := development
STAGES := development

base_yml := docker-compose.yml
override_yml := docker-compose.override.yml

stage_yml := docker-compose.$(stage).yml
stage_override_yml := docker-compose.$(stage).override.yml

if_exists = $(shell test -f $(1) && echo $(1) || 'not found $(1)')

ymls := \
	$(base_yml) \
	$(shell test -f $(override_yml)        && echo $(override_yml)) \
	$(stage_yml) \
	$(shell test -f $(stage_override_yml)  && echo $(stage_override_yml)) \


dc_args := $(foreach f,$(ymls),-f $(f))

.PHONY: check-stage
check-stage:
ifeq (,$(findstring $(stage), $(STAGES)))
	@echo 'ERROR: Invalid stage "$(stage)".'
	@echo 'Valid stages are $(STAGES)'
	@exit 1
else
	@echo 'stage=$(stage)'
endif

$(override_yml) $(stage_override_yml):
ifeq ($(shell test -f $@ || echo -n no),no)
	@echo 'Creating $@'
	touch $@
endif

.PHONY: check-overrides
check-overrides: $(override_yml) $(stage_override_yml)

.env.%.dev:
	touch $@

.PHONY: dev-envs
dev-envs: .env.common.dev .env.frontend.dev

.PHONE: check
check: check-overrides check-stage dev-envs

.PHONY: build
build: check
	docker-compose $(dc_args) build $(c)

.PHONY: up
up: check
	docker-compose $(dc_args) up -d $(c)

.PHONY: up-attach
up-attach: check
	docker-compose $(dc_args) up $(c)

.PHONY: start
start: check
	docker-compose $(dc_args) start $(c)

.PHONY: down
down: check
	docker-compose $(dc_args) down $(c)

.PHONY: destroy
destroy: check
	docker-compose $(dc_args) down -v $(c)

.PHONY: stop
stop: check
	docker-compose $(dc_args) stop $(c)

.PHONY: restart
restart: check
	docker-compose $(dc_args) stop $(c)
	docker-compose $(dc_args) up -d $(c)

.PHONY: logs
logs: check
	docker-compose $(dc_args) logs --tail=100 -f $(c)

.PHONY: ps
ps: check
	docker-compose $(dc_args) ps

.PHONY: rcli
rcli: check
	docker-compose $(dc_args) run rcli

.PHONY: print-config
print-config:
	@docker-compose $(dc_args) config
