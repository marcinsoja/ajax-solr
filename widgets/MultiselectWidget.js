(function($) {

    AjaxSolr.MultiselectWidget = AjaxSolr.AbstractFacetWidget.extend({
        cssClass: 'tagcloud_item'
        ,cssClassCount: 'tagcloud_count'
        ,cssClassActive: 'tagcloud_item_active'
        ,cssClassDisable: 'tagcloud_item_disable'
        ,fieldNames: {}
        ,getCurrentSelectedFields: function() {

            var fq = this.manager.store.values('fq')
                ,findIds = this.manager.store.find('fq', new RegExp('^-?' + this.field + ':'))
                ,selectedFields = []
            ;
            
            if(findIds) {
                selectedFields = str_replace(this.field+':', '', fq[findIds[0]]).split(" OR ");
            }
            
            return selectedFields;
            
        }
        ,translateFacet: function(facet) {
            if(facet in this.fieldNames) {
                return this.fieldNames[facet];
            }
            return facet;
        }
        ,afterRequest: function() {
            
            var facet
                ,facetName
                ,option
                ,isSelected
                ,facets = this.getFacets()
                ,selectedFields = this.getCurrentSelectedFields()
            ;
 
            $(this.target).empty();

            for (var i = 0, l = facets.length; i < l; i++) {
                
                facet = facets[i].facet;
                facetName = this.translateFacet(facet);
                
                option = null;
                
                isSelected = (-1 !== AjaxSolr.inArray(facet, selectedFields));
                
                if (facets[i].count || isSelected) {
                    
                    if (isSelected) {
                        option = this.createOption(facetName, facets[i].count, this.cssClassActive, this.unclickHandler(facet));
                    } else {
                        option = this.createOption(facetName, facets[i].count, "", this.clickHandler(facet));
                    }
                } else {
                    option = this.createOption(facetName, facets[i].count, this.cssClassDisable, void 0);
                }
                
                $(this.target).append(option);
            }
        }
        ,getFacets: function() {
            
            var facets = []
                ,countFacets
            ;
            
            for (var facetFor in this.manager.response.facet_counts.facet_fields[this.field]) {
                
                countFacets = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facetFor]);
                facets.push({facet: facetFor, count: countFacets});
            }
            
            facets.sort(function(a, b) {
                return a.facet < b.facet ? -1 : 1;
            });
            
            return facets;
        }
        ,createOption: function(name, count, cssClass, clickHandler) {
            var option = $('<a href="javascript:;" class="' + this.cssClass + " " + cssClass + '"></a>')
                .html('<span>' + name + '</span><span class="' + this.cssClassCount +'">(' + count + ')</span>')
            ;
            
            if(!!(clickHandler && clickHandler.constructor && clickHandler.call && clickHandler.apply)) {
                option.click(clickHandler);
            }
            
            return option;
        }
        ,fq: function(value, exclude) {
            return (exclude ? '-' : '') + this.field + ':' + AjaxSolr.Parameter.escapeValue(value);
        }
        ,initStore: function() {
            var parameters = [
                'facet.prefix',
                'facet.sort',
                'facet.limit',
                'facet.offset',
                'facet.mincount',
                'facet.missing',
                'facet.method',
                'facet.enum.cache.minDf'
            ];

            this.manager.store.addByValue('facet', true);

            if (this['facet.field'] !== undefined) {
                this.manager.store.add('facet.field', new AjaxSolr.Parameter({
                    name: 'facet.field', 
                    value: this.field, 
                    locals: {
                        ex: this.field
                    }
                }));
            }

            for (var i = 0, l = parameters.length; i < l; i++) {
                if (this[parameters[i]] !== undefined) {
                    this.manager.store.addByValue('f.' + this.field + '.' + parameters[i], this[parameters[i]]);
                }
            }
        }
        ,add: function(value) {
            return this.set(value);
        }
        ,set: function(value) {

            var selected = this.getCurrentSelectedFields()
                ,uniqueSelected
                ,self = this
            ;
            
            selected.push(value);
            
            uniqueSelected = this.getUnique(selected);
            
            return this.changeSelection(function() {
                return self.updateLocalState(selected);
            });
        }
        ,remove: function(value) {
            
            var selected = this.getCurrentSelectedFields()
                ,key = AjaxSolr.inArray(value, selected)
                ,self = this
            ;
            
            if (-1 !== key) {
                selected.splice(key, 1);
            }
            
            return this.changeSelection(function() {
                return self.updateLocalState(selected);
            });
        }
        , updateLocalState: function(selected) {

            var current = []
                ,self = this
            ;

            $.each(selected, function(i, value) {
                current.push(self.fq(value));
            });

            this.manager.store.removeByValue('fq', new RegExp('^-?' + this.field + ':'));
            
            if (current.length) {
                this.manager.store.add('fq', new AjaxSolr.Parameter({
                    name: 'fq', 
                    value: current.join(' OR '), 
                    locals: {
                        tag: this.field
                    }
                }));
            }
            return true;
        }
        ,getUnique: function(array) {
            var u = {}, a = [];
            for (var i = 0, l = array.length; i < l; ++i) {
                if (u.hasOwnProperty(array[i])) {
                    continue;
                }
                a.push(array[i]);
                u[array[i]] = 1;
            }
            return a;
        }
    });

})(jQuery);
