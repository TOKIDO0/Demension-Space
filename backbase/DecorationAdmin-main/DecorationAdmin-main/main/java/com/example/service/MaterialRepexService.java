package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.MaterialRep;
import com.example.entity.MaterialRepex;
import com.example.entity.Materialpurchase;
import com.example.entity.Supplyinfo;
import com.example.mapper.*;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Service
public class MaterialRepexService extends ServiceImpl<MaterialRepexMapper, MaterialRepex> {

    @Resource
    private MaterialRepService materialRepService;
    @Resource
    private MaterialpurchaseMapper materialpurchaseMapper;

    public MaterialRepex generate(long id)
    {
        MaterialRepex materialRepex=new MaterialRepex();
        materialRepex.setMaterialReps(materialRepService.generate(id));

        Integer money=0;
        List<Materialpurchase> materialpurchaseList=new ArrayList<>();
        QueryWrapper<Materialpurchase> wrapper1 = new QueryWrapper<>();
        wrapper1.eq("projectid",id);
        materialpurchaseList=materialpurchaseMapper.selectList(wrapper1);
        for(Materialpurchase materialpurchase:materialpurchaseList)
        {
            money+= materialpurchase.getMoney();
        }
        materialRepex.setMoneyinall(money);

        return materialRepex;
    }

}
